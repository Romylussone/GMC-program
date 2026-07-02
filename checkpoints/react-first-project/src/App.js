import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Row from 'react-bootstrap/Row';

const cardDetails = [
  {
    title: 'Fast Setup',
    text: 'Build a React interface quickly with ready-made Bootstrap components.',
    action: 'Start',
  },
  {
    title: 'Responsive Layouts',
    text: 'Use Bootstrap grids and spacing utilities to keep content organized.',
    action: 'Explore',
  },
  {
    title: 'Reusable UI',
    text: 'Compose navbars, cards, buttons, and other components in React.',
    action: 'Learn',
  },
];

function App() {
  return (
    <>
      <div className="App min-vh-100 bg-light">
        <Navbar bg="dark" data-bs-theme="dark" expand="lg" className="mb-5">
          <Container>
            <Navbar.Brand href="#home">React Bootstrap App</Navbar.Brand>
            <Navbar.Toggle aria-controls="main-navbar" />
            <Navbar.Collapse id="main-navbar">
              <Nav className="ms-auto">
                <Nav.Link href="#home">Home</Nav.Link>
                <Nav.Link href="#features">Features</Nav.Link>
                <Nav.Link href="#contact">Contact</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Container className="pb-5">
          <h1 className="display-5 fw-semibold text-center mb-4">
            Welcome to React Bootstrap
          </h1>

          <Row xs={1} md={3} className="g-4">
            {cardDetails.map((card) => (
              <Col key={card.title}>
                <Card className="h-100 shadow-sm">
                  <Card.Body className="d-flex flex-column">
                    <Card.Title>{card.title}</Card.Title>
                    <Card.Text>{card.text}</Card.Text>
                    <Button variant="primary" className="mt-auto">
                      {card.action}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </div>
    </>
  );
}

export default App;
