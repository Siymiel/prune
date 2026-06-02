"""End-to-end test for the Example workflow (text-input → code → output).

Runs entirely in-process — no database, no API server, no external services.
"""

import pytest

from prune_api.engine.runner import RunStatus, run_workflow
from prune_api.nodes.registry import NODE_REGISTRY
from prune_api.routers.runs import _canvas_to_engine

# ---------------------------------------------------------------------------
# Canvas definition (mirrors EXAMPLE_NODES / EXAMPLE_EDGES in builder-editor.tsx)
# ---------------------------------------------------------------------------

EXAMPLE_CANVAS = {
    "nodes": [
        {
            "id": "ex-in-1",
            "kind": "text-input",
            "label": "Text Input",
            "x": 80,
            "y": 220,
            "inputValue": "Hello from Prune!",
        },
        {
            "id": "ex-code-1",
            "kind": "code",
            "label": "Format Message",
            "x": 360,
            "y": 220,
            "code": (
                'msg = state.get("message", "")\n'
                'output["result"] = msg.upper()\n'
                'output["word_count"] = len(msg.split())\n'
                'output["char_count"] = len(msg)'
            ),
        },
        {
            "id": "ex-out-1",
            "kind": "output",
            "label": "Output",
            "x": 640,
            "y": 220,
        },
    ],
    "edges": [
        {"id": "ex-e-1", "sourceId": "ex-in-1", "targetId": "ex-code-1"},
        {"id": "ex-e-2", "sourceId": "ex-code-1", "targetId": "ex-out-1"},
    ],
}


# ---------------------------------------------------------------------------
# Canvas → engine conversion tests
# ---------------------------------------------------------------------------


def test_canvas_to_engine_structure():
    graph = _canvas_to_engine(EXAMPLE_CANVAS)

    assert graph["entry"] == "ex-in-1", "entry should be the node with no incoming edges"

    node_map = {n["id"]: n for n in graph["nodes"]}
    assert set(node_map) == {"ex-in-1", "ex-code-1", "ex-out-1"}

    assert node_map["ex-in-1"]["type"] == "input.text"
    assert node_map["ex-code-1"]["type"] == "logic.code"
    assert node_map["ex-out-1"]["type"] == "passthrough"


def test_canvas_to_engine_next_pointers():
    graph = _canvas_to_engine(EXAMPLE_CANVAS)
    node_map = {n["id"]: n for n in graph["nodes"]}

    assert node_map["ex-in-1"]["config"]["next"] == "ex-code-1"
    assert node_map["ex-code-1"]["config"]["next"] == "ex-out-1"
    assert node_map["ex-out-1"]["config"]["next"] is None


def test_canvas_to_engine_code_config():
    graph = _canvas_to_engine(EXAMPLE_CANVAS)
    node_map = {n["id"]: n for n in graph["nodes"]}

    code = node_map["ex-code-1"]["config"]["code"]
    assert 'output["result"] = msg.upper()' in code
    assert 'output["word_count"]' in code
    assert 'output["char_count"]' in code


def test_canvas_to_engine_empty_graph():
    graph = _canvas_to_engine({"nodes": [], "edges": []})
    assert graph["entry"] is None
    assert graph["nodes"] == []


# ---------------------------------------------------------------------------
# Full workflow execution tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_example_workflow_runs_to_done():
    graph = _canvas_to_engine(EXAMPLE_CANVAS)
    result = await run_workflow(
        graph,
        inputs={},
        tenant_id="test-tenant",
        conversation_id="",
        run_id="test-run-1",
        node_registry=NODE_REGISTRY,
    )

    assert result["status"] == RunStatus.DONE


@pytest.mark.asyncio
async def test_example_workflow_output_values():
    graph = _canvas_to_engine(EXAMPLE_CANVAS)
    result = await run_workflow(
        graph,
        inputs={},
        tenant_id="test-tenant",
        conversation_id="",
        run_id="test-run-2",
        node_registry=NODE_REGISTRY,
    )

    state = result["state"]
    assert state["message"] == "Hello from Prune!"
    assert state["result"] == "HELLO FROM PRUNE!"
    assert state["word_count"] == 3
    assert state["char_count"] == 17


@pytest.mark.asyncio
async def test_example_workflow_trace_length():
    graph = _canvas_to_engine(EXAMPLE_CANVAS)
    result = await run_workflow(
        graph,
        inputs={},
        tenant_id="test-tenant",
        conversation_id="",
        run_id="test-run-3",
        node_registry=NODE_REGISTRY,
    )

    trace = result["trace"]
    assert len(trace) == 3

    node_ids = [s["node"] for s in trace]
    assert node_ids == ["ex-in-1", "ex-code-1", "ex-out-1"]

    for step in trace:
        assert step["status"] == "ok"
        assert step["ms"] >= 0


@pytest.mark.asyncio
async def test_runtime_input_used_when_no_static_value():
    """When inputValue is absent on the canvas node, runtime inputs are used."""
    canvas_no_static = {
        "nodes": [
            {"id": "n-in", "kind": "text-input", "label": "Input"},  # no inputValue
            {"id": "n-code", "kind": "code", "label": "Code",
             "code": 'output["result"] = state.get("message", "").upper()'},
        ],
        "edges": [{"id": "e1", "sourceId": "n-in", "targetId": "n-code"}],
    }
    graph = _canvas_to_engine(canvas_no_static)
    result = await run_workflow(
        graph,
        inputs={"message": "hi world"},
        tenant_id="test-tenant",
        conversation_id="",
        run_id="test-run-4",
        node_registry=NODE_REGISTRY,
    )

    assert result["status"] == RunStatus.DONE
    assert result["state"]["result"] == "HI WORLD"


@pytest.mark.asyncio
async def test_code_node_error_is_captured():
    """A code node with a runtime error should produce status=error."""
    bad_canvas = {
        "nodes": [
            {"id": "n1", "kind": "text-input", "inputValue": "x"},
            {"id": "n2", "kind": "code", "code": "1 / 0"},
        ],
        "edges": [{"id": "e1", "sourceId": "n1", "targetId": "n2"}],
    }
    graph = _canvas_to_engine(bad_canvas)
    result = await run_workflow(
        graph,
        inputs={},
        tenant_id="test-tenant",
        conversation_id="",
        run_id="test-run-5",
        node_registry=NODE_REGISTRY,
    )

    assert result["status"] == RunStatus.ERROR
    assert "division by zero" in (result.get("error") or "")
