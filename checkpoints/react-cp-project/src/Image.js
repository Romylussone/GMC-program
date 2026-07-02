import Card from "react-bootstrap/Card";
import product from "./product";

function Image() {
  return (
    <Card.Img
      className="product-image"
      variant="top"
      src={product.image}
      alt={product.name}
    />
  );
}

export default Image;
