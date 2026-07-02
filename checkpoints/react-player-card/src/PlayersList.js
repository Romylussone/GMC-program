import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Player from "./Player";
import players from "./players";

function PlayersList() {
  return (
    <Row xs={1} sm={2} lg={4} className="g-4">
      {players.map((player) => (
        <Col key={`${player.name}-${player.jerseyNumber}`}>
          <Player {...player} />
        </Col>
      ))}
    </Row>
  );
}

export default PlayersList;
