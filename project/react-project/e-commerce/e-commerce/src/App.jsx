import { useState } from 'react'
import './App.css'
import { useEffect } from 'react'
import ProductCard from './components/ProductCard';

function App() {

  const [products, setProducts] = useState([]) 

  useEffect(() => { 

    fetch("https://fakestoreapi.com/products")
         .then(data => data.json())
         .then(data => setProducts(data))

  },[]);

  return (
    <div className='product-container'>
    {
      products.map( product => ( <ProductCard product={product}></ProductCard>))
    }
    </div>
  )
}

export default App
