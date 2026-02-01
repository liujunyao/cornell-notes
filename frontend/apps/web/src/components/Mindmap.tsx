/**
 * 思维导图组件
 */
import { useState } from 'react'
import './Mindmap.css'

export interface MindmapNode {
  id: string
  label: string
  children: MindmapNode[]
}

interface MindmapProps {
  data: MindmapNode | null
}

// 渲染单个节点
function MindmapNodeComponent({ node, level = 0 }: { node: MindmapNode; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(true)

  const getIcon = () => {
    if (node.children.length === 0) return '📄'
    if (level === 0) return '🎯'
    if (level === 1) return '📌'
    if (level === 2) return '▪'
    return '·'
  }

  return (
    <div className="mindmap-node">
      <div
        className={`mindmap-node-content level-${level}`}
        onClick={() => node.children.length > 0 && setIsExpanded(!isExpanded)}
      >
        <span className="mindmap-node-icon">{getIcon()}</span>
        <span className="mindmap-node-label">{node.label}</span>
        {node.children.length > 0 && (
          <span style={{ fontSize: '12px', opacity: 0.7 }}>
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
      </div>

      {isExpanded && node.children.length > 0 && (
        <div className="mindmap-children">
          {node.children.map((child) => (
            <MindmapNodeComponent key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Mindmap({ data }: MindmapProps) {
  if (!data) {
    return null
  }

  return (
    <div className="mindmap-container">
      <div className="mindmap-tree">
        <MindmapNodeComponent node={data} level={0} />
      </div>
    </div>
  )
}
