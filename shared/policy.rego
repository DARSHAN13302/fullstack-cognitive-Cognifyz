package fullstack.cognitive.authz

default allow := false
default require_hitl := true

high_risk_actions := {"deploy_prod", "delete_record", "approve_budget", "rotate_keys"}
forbidden_actions := {"delete_database", "disable_audit"}

allow if {
    not forbidden_actions[input.action]
    input.ci_passed == true
    role_permitted
}

role_permitted if {
    input.role == "admin"
}

role_permitted if {
    input.role == "engineer"
    input.action != "approve_budget"
}

role_permitted if {
    input.role == "viewer"
    input.action == "read"
}

require_hitl if {
    high_risk_actions[input.action]
}

require_hitl if {
    input.confidence < 0.85
}
