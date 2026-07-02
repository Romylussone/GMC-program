import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";

function Player({
  name = Player.defaultProps.name,
  team = Player.defaultProps.team,
  nationality = Player.defaultProps.nationality,
  jerseyNumber = Player.defaultProps.jerseyNumber,
  age = Player.defaultProps.age,
  imageUrl = Player.defaultProps.imageUrl,
}) {
  const cardStyle = {
    background: "linear-gradient(160deg, #f8fafc 0%, #fef3c7 52%, #facc15 100%)",
    border: "2px solid rgba(250, 204, 21, 0.7)",
    borderRadius: "8px",
    boxShadow: "0 18px 36px rgba(0, 0, 0, 0.24)",
    color: "#111827",
    minHeight: "100%",
    overflow: "hidden",
  };

  const imageStyle = {
    aspectRatio: "4 / 3",
    objectFit: "cover",
    objectPosition: "center top",
  };

  const numberStyle = {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: "50%",
    color: "#facc15",
    display: "inline-flex",
    fontSize: "1.05rem",
    fontWeight: 900,
    height: "44px",
    justifyContent: "center",
    width: "44px",
  };

  const labelStyle = {
    color: "#475569",
    fontSize: "0.72rem",
    fontWeight: 800,
    letterSpacing: 0,
    textTransform: "uppercase",
  };

  return (
    <Card style={cardStyle}>
      <Card.Img variant="top" src={imageUrl} alt={name} style={imageStyle} />
      <Card.Body>
        <div className="d-flex align-items-start justify-content-between gap-3">
          <div>
            <Card.Title className="mb-1" style={{ fontWeight: 900 }}>
              {name}
            </Card.Title>
            <Card.Subtitle className="mb-3 text-muted">{team}</Card.Subtitle>
          </div>
          <span style={numberStyle}>{jerseyNumber}</span>
        </div>

        <ListGroup variant="flush" style={{ borderRadius: "8px", overflow: "hidden" }}>
          <ListGroup.Item className="d-flex justify-content-between">
            <span style={labelStyle}>Nationality</span>
            <Badge bg="dark">{nationality}</Badge>
          </ListGroup.Item>
          <ListGroup.Item className="d-flex justify-content-between">
            <span style={labelStyle}>Age</span>
            <strong>{age}</strong>
          </ListGroup.Item>
          <ListGroup.Item>
            <a href={imageUrl} target="_blank" rel="noreferrer" style={{ color: "#166534" }}>
              Image URL
            </a>
          </ListGroup.Item>
        </ListGroup>
      </Card.Body>
    </Card>
  );
}

Player.defaultProps = {
  name: "Unknown Player",
  team: "Free Agent",
  nationality: "Unknown",
  jerseyNumber: 0,
  age: 18,
  imageUrl: "https://placehold.co/600x450?text=Player",
};

export default Player;
