async function record(client, req, action, entity, id, description = null) {
  await client.query(
    "INSERT INTO activity_log(user_id,action,entity_type,entity_id,description,ip_address,user_agent) VALUES($1,$2,$3,$4,$5,$6,$7)",
    [
      req.user?.user_id || null,
      action,
      entity,
      id,
      description,
      req.ip,
      (req.get("user-agent") || "").slice(0, 1000),
    ],
  );
}
module.exports = { record };
