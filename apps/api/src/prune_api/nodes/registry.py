"""Central registry mapping node type strings to their implementation classes."""

from __future__ import annotations

from prune_api.nodes.ai import AIRespondNode
from prune_api.nodes.base import Node
from prune_api.nodes.mpesa import MpesaSTKPushNode

NODE_REGISTRY: dict[str, type[Node]] = {
    AIRespondNode.type: AIRespondNode,
    MpesaSTKPushNode.type: MpesaSTKPushNode,
}
