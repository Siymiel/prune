"""Central registry mapping node type strings to their implementation classes."""

from __future__ import annotations

from prune_api.nodes.ai import AIRespondNode
from prune_api.nodes.base import Node
from prune_api.nodes.knowledge import KnowledgeBaseNode
from prune_api.nodes.logic import CodeNode, IfElseNode, OutputNode, PassthroughNode, TextInputNode
from prune_api.nodes.mpesa import MpesaSTKPushNode
from prune_api.nodes.subflow import SubflowToolNode, WorkflowCallNode

NODE_REGISTRY: dict[str, type[Node]] = {
    AIRespondNode.type: AIRespondNode,
    KnowledgeBaseNode.type: KnowledgeBaseNode,
    MpesaSTKPushNode.type: MpesaSTKPushNode,
    PassthroughNode.type: PassthroughNode,
    TextInputNode.type: TextInputNode,
    IfElseNode.type: IfElseNode,
    CodeNode.type: CodeNode,
    OutputNode.type: OutputNode,
    SubflowToolNode.type: SubflowToolNode,
    WorkflowCallNode.type: WorkflowCallNode,
}
