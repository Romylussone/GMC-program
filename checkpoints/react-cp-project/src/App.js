import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import BootstrapImage from "react-bootstrap/Image";
import ProductImage from "./Image";
import Name from "./Name";
import Price from "./Price";
import Description from "./Description";
import "./App.css";

const firstName = "";

function App() {
  return (
    <main className="app-shell">
      <section className="product-stage" aria-label="Featured product">
        <Card className="product-card">
          <div className="product-media">
            <ProductImage />
            <Badge bg="light" text="dark" className="product-badge">
              Small Batch
            </Badge>
          </div>

          <Card.Body className="product-body">
            <div className="product-copy">
              <Name />
              <Description />
            </div>

            <div className="product-action">
              <Price />
              <Button className="cart-button" variant="dark">
                Reserve Kit
              </Button>
            </div>
          </Card.Body>
        </Card>

        <div className="greeting-panel">
          <p>{firstName ? `Hello, ${firstName}!` : "Hello, there!"}</p>
          {firstName && (
            <BootstrapImage
              roundedCircle
              className="avatar"
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                firstName
              )}&background=14b8a6&color=ffffff&bold=true&size=128`}
              alt={firstName}
            />
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
