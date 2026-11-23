#!/usr/bin/env python3
"""
MCP-compatible JSON-RPC 2.0 Tool Server (Model Context Protocol v2026-07-28 style).
Exposes scoped read-only and policy-evaluation tools for cognitive full-stack agents.
Run `python3 shared/mcp_tools_server.py --self-test` to verify locally.
"""
import hashlib
import json
import sys
from datetime import datetime, timezone

TOOLS = [
    {
        "name": "get_system_health",
        "description": "Returns service health metadata and supported Node.js LTS target.",
        "inputSchema": {"type": "object", "properties": {"service": {"type": "string"}}, "required": ["service"]},
    },
    {
        "name": "evaluate_release_gate",
        "description": "Deterministically checks whether a build meets v7.0 release exit criteria.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "tests_passed": {"type": "boolean"},
                "high_cves": {"type": "integer"},
                "coverage_pct": {"type": "number"},
            },
            "required": ["tests_passed", "high_cves", "coverage_pct"],
        },
    },
    {
        "name": "compute_artifact_digest",
        "description": "Computes a SHA-256 integrity digest for a payload or release manifest.",
        "inputSchema": {"type": "object", "properties": {"payload": {"type": "string"}}, "required": ["payload"]},
    },
]


def handle_rpc(req: dict) -> dict:
    rpc_id = req.get("id")
    method = req.get("method")
    params = req.get("params") or {}

    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": rpc_id, "result": {"tools": TOOLS}}

    if method == "tools/call":
        name = params.get("name")
        args = params.get("arguments") or {}

        if name == "get_system_health":
            return {
                "jsonrpc": "2.0",
                "id": rpc_id,
                "result": {
                    "service": args.get("service", "unknown"),
                    "status": "ok",
                    "target_runtime": "Node.js 24 LTS",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            }

        if name == "evaluate_release_gate":
            passed = bool(args.get("tests_passed"))
            cves = int(args.get("high_cves", 1))
            cov = float(args.get("coverage_pct", 0.0))
            approved = passed and cves == 0 and cov >= 80.0
            return {
                "jsonrpc": "2.0",
                "id": rpc_id,
                "result": {
                    "approved": approved,
                    "gate": "PASS" if approved else "BLOCKED",
                    "criteria": {"tests_passed": passed, "high_cves": cves, "coverage_pct": cov},
                },
            }

        if name == "compute_artifact_digest":
            digest = hashlib.sha256(str(args.get("payload", "")).encode("utf-8")).hexdigest()
            return {"jsonrpc": "2.0", "id": rpc_id, "result": {"algorithm": "SHA-256", "digest": digest}}

        return {"jsonrpc": "2.0", "id": rpc_id, "error": {"code": -32601, "message": f"Unknown tool: {name}"}}

    return {"jsonrpc": "2.0", "id": rpc_id, "error": {"code": -32601, "message": f"Unknown method: {method}"}}


def self_test() -> int:
    r1 = handle_rpc({"jsonrpc": "2.0", "id": 1, "method": "tools/list"})
    assert len(r1["result"]["tools"]) == 3
    r2 = handle_rpc({
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {"name": "evaluate_release_gate", "arguments": {"tests_passed": True, "high_cves": 0, "coverage_pct": 88.5}},
    })
    assert r2["result"]["approved"] is True
    r3 = handle_rpc({
        "jsonrpc": "2.0",
        "id": 3,
        "method": "tools/call",
        "params": {"name": "evaluate_release_gate", "arguments": {"tests_passed": True, "high_cves": 2, "coverage_pct": 90.0}},
    })
    assert r3["result"]["approved"] is False
    print("MCP Python Tool Server self-test PASSED (3/3 assertions)")
    return 0


if __name__ == "__main__":
    if "--self-test" in sys.argv:
        sys.exit(self_test())
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        resp = handle_rpc(json.loads(line))
        sys.stdout.write(json.dumps(resp) + "\n")
        sys.stdout.flush()
