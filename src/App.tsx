/*
 * App — route table. Layout wraps every page (header/footer);
 * pages render into its <Outlet />.
 */
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ShopByVehicle from './pages/ShopByVehicle'
import ShopBySize from './pages/ShopBySize'
import TireDetail from './pages/TireDetail'
import CartPage from './pages/CartPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop/vehicle" element={<ShopByVehicle />} />
        <Route path="/shop/size" element={<ShopBySize />} />
        <Route path="/tire/:id" element={<TireDetail />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}

export default App
