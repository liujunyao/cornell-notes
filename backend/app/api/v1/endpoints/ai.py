"""AI 服务相关 API 端点"""
from typing import Optional, AsyncGenerator

from agno.agent import Agent
from agno.models.message import Message
from agno.models.openai import OpenAIChat
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import logging
from markdownify import markdownify as md

from app.api.deps import get_current_user, get_db
from app.api.v1.schemas import (
    ChatRequest,
    ChatResponse,
    ExploreRequest,
    ExploreResponse,
    ExtractPointRequest,
    ExtractPointResponse,
    GenerateMindmapRequest,
    GenerateMindmapResponse,
    MindmapNode,
    CheckSummaryRequest,
    CheckSummaryResponse,
)
from app.models import User, CornellNote
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

def get_explore_model() -> Optional[OpenAIChat]:
    if not settings.explore_api_key or not settings.explore_base_url or not settings.explore_model_name:
        return None
    return OpenAIChat(id=settings.explore_model_name, api_key=settings.explore_api_key, base_url=settings.explore_base_url, role_map={"user": "user", "assistant": "assistant",  "system": "system"})


@router.post("/explore", response_model=ExploreResponse)
async def explore(
    request: ExploreRequest,
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """深度探索对话接口

    专门用于笔记编辑器中的"深度探索"功能，
    提供更详细、结构化的知识解释。

    Args:
        request: 探索请求
        current_user: 当前用户

    Returns:
        ExploreResponse: AI探索回答（Markdown格式）

    Raises:
        HTTPException: AI服务未配置或调用失败
    """

    model = get_explore_model()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI 服务未配置，请设置!",
        )

    system_prompt = """
# 角色
你是一位专业的知识讲解专家,擅长将复杂知识点拆解透彻、结合实例辅助理解。用户提出的核心知识/问题，需要你深度解析。

# 解析要求
1. 核心原理：用通俗易懂的语言讲解该知识点的底层逻辑、核心定义、本质原理，避免晦涩术语堆砌；
2. 详细示例：提供至少3个不同场景的实用示例（含具体操作/应用步骤），覆盖基础用法、进阶用法、常见场景；
3. 用法拓展：说明该知识点的适用范围、使用技巧、注意事项，以及与相关知识点的关联；
4. 问题补充：若现有知识存在模糊点，针对性解答"为什么""如何做""有什么用"等关键问题；
5. 总结提炼：最后用3-5条核心要点总结，方便快速记忆。

# 回答规范
请以结构化形式输出（分点+小标题），逻辑清晰、内容详实，确保可直接用于学习和实践。
    """

    agent = Agent(
        name="knowledge_explorer",
        model=model,
        # 不使用 system_message，避免生成 'developer' 角色
    )

    # 手动构建消息列表，将 system prompt 作为第一条消息
    messages = [Message(role="system", content=system_prompt)]

    # 添加历史对话（只取最近4条）
    messages.extend([
        Message(role=msg.role, content=msg.content)
        for msg in request.history[-4:]
    ])

    # messages.append(Message(role="user", content=request.question))

    async def generate() -> AsyncGenerator[str, None]:
        """Generate SSE stream."""
        try:
            response_stream = agent.run(messages, stream=True)

            for chunk in response_stream:
                # 提取增量内容（根据 Agno 版本，chunk 通常包含 content 属性）
                if chunk.content:
                    # 按照 SSE 标准格式封装数据
                    yield f"data: {chunk.content}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: 对话异常：{str(e)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


@router.post("/extractPoint", response_model=ExtractPointResponse)
async def extract_point(
    request: ExtractPointRequest,
    current_user: User = Depends(get_current_user),
) -> ExtractPointResponse:
    """提炼康奈尔笔记的线索和问题

    将笔记内容转换为适合康奈尔笔记法的线索栏内容。

    Args:
        request: 提炼请求（包含笔记ID和内容）
        current_user: 当前用户

    Returns:
        ExtractPointResponse: 提炼的线索和问题列表

    Raises:
        HTTPException: AI服务未配置或调用失败
    """

    model = get_explore_model()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI 服务未配置，请设置!",
        )

    # 将HTML转换为Markdown
    markdown_content = md(request.note_content, strip=['script', 'style'])

    # 如果内容为空或太短，返回空列表
    if not markdown_content or len(markdown_content.strip()) < 10:
        return ExtractPointResponse(cue_points=[])

    system_prompt = """
# 角色
你是一位康奈尔笔记法专家，擅长从笔记内容中提炼关键线索和核心问题。

# 任务
根据用户提供的笔记内容，提炼出适合放在康奈尔笔记"线索栏"的内容。
线索栏的作用是：记录关键词、核心问题、重要概念，帮助后续复习和回忆。

# 要求
1. 每条线索尽可能简短（5-15个字）
2. 优先提炼：关键概念、核心问题、重要术语、关键步骤
3. 使用疑问句形式可以增强复习效果（如"什么是XX？""如何XX？""为什么XX？"）
4. 提炼3-8条线索（根据内容长度调整）
5. 确保线索能够覆盖笔记的主要内容点

# 输出格式
请只输出线索列表，每行一条，不要添加序号、符号或其他格式：
线索1
线索2
线索3
"""

    user_prompt = f"""请根据以下笔记内容，提炼适合康奈尔笔记线索栏的关键线索和问题：

{markdown_content}
"""

    agent = Agent(
        name="cue_extractor",
        model=model,
    )

    messages = [
        Message(role="system", content=system_prompt),
        Message(role="user", content=user_prompt)
    ]

    try:
        # 同步调用，不使用流式
        response = agent.run(messages, stream=False)

        # 提取响应内容
        answer = response.content if hasattr(response, 'content') else str(response)

        # 解析为列表（按行分割，去除空行）
        cue_points = [
            line.strip()
            for line in answer.strip().split('\n')
            if line.strip() and not line.strip().startswith('#')
        ]

        # 限制最多10条
        cue_points = cue_points[:10]

        return ExtractPointResponse(cue_points=cue_points)

    except Exception as e:
        logger.error(f"提炼线索失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI 服务错误: {str(e)}"
        )


@router.post("/generateMindmap", response_model=GenerateMindmapResponse)
async def generate_mindmap(
    request: GenerateMindmapRequest,
    current_user: User = Depends(get_current_user),
) -> GenerateMindmapResponse:
    """生成思维导图

    将笔记内容转换为思维导图的树形结构。

    Args:
        request: 生成请求（包含笔记ID和内容）
        current_user: 当前用户

    Returns:
        GenerateMindmapResponse: 思维导图数据

    Raises:
        HTTPException: AI服务未配置或调用失败
    """

    model = get_explore_model()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI 服务未配置，请设置!",
        )

    # 将HTML转换为Markdown
    markdown_content = md(request.note_content, strip=['script', 'style'])

    # 如果内容为空或太短，返回默认结构
    if not markdown_content or len(markdown_content.strip()) < 10:
        return GenerateMindmapResponse(
            mindmap=MindmapNode(
                id="root",
                label="空笔记",
                children=[]
            )
        )

    system_prompt = """
# 角色
你是一位思维导图专家，擅长将复杂的笔记内容转换为清晰的层级结构。

# 任务
根据用户提供的笔记内容，生成一个思维导图的JSON结构。

# 要求
1. 提取笔记的主题作为根节点
2. 将内容按层级组织（通常2-4层）
3. 每个节点的label要简洁（5-15个字）
4. 保持逻辑清晰，层级分明
5. 节点数量适中（总共10-30个节点）

# 输出格式
请严格按照以下JSON格式输出，不要添加任何其他文字：

```json
{
  "id": "root",
  "label": "主题名称",
  "children": [
    {
      "id": "node-1",
      "label": "一级分支1",
      "children": [
        {
          "id": "node-1-1",
          "label": "二级分支1.1",
          "children": []
        }
      ]
    },
    {
      "id": "node-2",
      "label": "一级分支2",
      "children": []
    }
  ]
}
```

# 注意
- id必须唯一，使用 node-1, node-2, node-1-1 这样的格式
- 所有节点都必须有 id, label, children 三个字段
- children 是数组，可以为空数组 []
- label 要简洁明了，概括性强
- 只输出JSON，不要添加任何解释文字
"""

    user_prompt = f"""请根据以下笔记内容生成思维导图JSON：

{markdown_content}
"""

    agent = Agent(
        name="mindmap_generator",
        model=model,
    )

    messages = [
        Message(role="system", content=system_prompt),
        Message(role="user", content=user_prompt)
    ]

    try:
        # 同步调用
        response = agent.run(messages, stream=False)

        # 提取响应内容
        answer = response.content if hasattr(response, 'content') else str(response)

        # 尝试从响应中提取JSON
        import json
        import re

        # 提取JSON部分（可能被包裹在markdown代码块中）
        json_match = re.search(r'```json\s*(\{[\s\S]*?\})\s*```', answer)
        if json_match:
            json_str = json_match.group(1)
        else:
            # 尝试直接解析
            json_str = answer.strip()

        # 解析JSON
        mindmap_data = json.loads(json_str)

        # 验证基本结构
        if not isinstance(mindmap_data, dict) or 'id' not in mindmap_data or 'label' not in mindmap_data:
            raise ValueError("Invalid mindmap structure")

        # 转换为 Pydantic 模型
        mindmap = MindmapNode(**mindmap_data)

        return GenerateMindmapResponse(mindmap=mindmap)

    except json.JSONDecodeError as e:
        logger.error(f"思维导图JSON解析失败: {str(e)}, 原始内容: {answer[:200]}")
        # 返回默认结构
        return GenerateMindmapResponse(
            mindmap=MindmapNode(
                id="root",
                label="解析失败",
                children=[
                    MindmapNode(
                        id="node-1",
                        label="AI返回格式错误",
                        children=[]
                    )
                ]
            )
        )
    except Exception as e:
        logger.error(f"生成思维导图失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI 服务错误: {str(e)}"
        )


@router.post("/checkSummary", response_model=CheckSummaryResponse)
async def check_summary(
    request: CheckSummaryRequest,
    current_user: User = Depends(get_current_user),
) -> CheckSummaryResponse:
    """检查用户总结

    根据笔记内容，对用户的总结进行检查，提供反馈意见。

    Args:
        request: 检查请求（包含笔记ID、笔记内容和用户总结）
        current_user: 当前用户

    Returns:
        CheckSummaryResponse: AI反馈内容

    Raises:
        HTTPException: AI服务未配置或调用失败
    """

    model = get_explore_model()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI 服务未配置，请设置!",
        )

    # 将HTML转换为Markdown
    markdown_content = md(request.note_content, strip=['script', 'style'])
    markdown_summary = md(request.user_summary, strip=['script', 'style'])

    # 如果笔记内容或总结为空，返回提示
    if not markdown_content or len(markdown_content.strip()) < 10:
        return CheckSummaryResponse(
            feedback="❌ **笔记内容为空**\n\n无法对空笔记进行总结检查，请先添加笔记内容。"
        )

    if not markdown_summary or len(markdown_summary.strip()) < 5:
        return CheckSummaryResponse(
            feedback="❌ **总结内容为空**\n\n请先编写总结内容，再进行AI检查。"
        )

    system_prompt = """
# 角色
你是一位专业的学习顾问，擅长评估学生的笔记总结质量。

# 任务
根据用户的笔记内容和他们写的总结，进行全面的检查和反馈。

# 检查要点
1. **准确性**：总结是否准确反映了笔记的核心内容
2. **完整性**：是否遗漏了重要知识点
3. **逻辑性**：总结的组织结构是否清晰
4. **重点突出**：是否抓住了最关键的内容
5. **需要注意的点**：哪些容易混淆或需要特别关注的概念

# 输出格式
使用Markdown格式输出，结构清晰，包含以下部分：

## ✅ 总结质量评价
[简要评价用户总结的整体质量，1-2句话]

## 📊 检查结果

### 优点
- [列出总结做得好的地方]

### 需要改进
- [列出遗漏的要点或不准确的地方]

## 💡 重要提醒
[列出需要特别注意的知识点，或容易混淆的概念]

## 📝 改进建议
[给出具体的改进方向，1-3条]

# 注意事项
- 语气友好、鼓励性，同时保持专业
- 反馈要具体，避免空泛
- 如果总结质量很高，给予充分肯定
- 重点关注学习效果，而非文字表述
"""

    user_prompt = f"""请检查以下笔记的总结：

## 笔记内容
{markdown_content}

## 用户的总结
{markdown_summary}
"""

    agent = Agent(
        name="summary_checker",
        model=model,
    )

    messages = [
        Message(role="system", content=system_prompt),
        Message(role="user", content=user_prompt)
    ]

    try:
        # 同步调用
        response = agent.run(messages, stream=False)

        # 提取响应内容
        feedback = response.content if hasattr(response, 'content') else str(response)

        return CheckSummaryResponse(feedback=feedback)

    except Exception as e:
        logger.error(f"检查总结失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI 服务错误: {str(e)}"
        )

