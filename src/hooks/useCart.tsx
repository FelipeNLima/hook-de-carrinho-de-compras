import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  //localStorage.clear();

  const addProduct = async (productId: number) => {
    try {
      const res = await api.get(`stock/${productId}`);
      const stock = res.data;

      if (cart.find((item) => item.id === productId)) {
        for (const item of cart) {
          if (item.id === productId) {
            if (item.amount >= stock.amount) {
              toast.error("Quantidade solicitada fora de estoque");
              return;
            } else {
              const data = { ...item, amount: Number(item.amount) + 1 };
              localStorage.setItem(
                "@RocketShoes:cart",
                JSON.stringify([...cart, data])
              );
              setCart([...cart, data]);
            }
          }
        }
      } else {
        const res = await api.get(`products/${productId}`);
        const product = res.data;
        setCart([...cart, { ...product, amount: 1 }]);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify([...cart, { ...product, amount: 1 }])
        );
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if (cart.find((item) => item.id === productId)) {
        const newCart = cart.filter((item) => item.id !== productId);
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      } else {
        toast.error("Erro na remoção do produto");
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;
      const res = await api.get(`stock/${productId}`);
      const stock = res.data;
      if (amount > stock.amount)
        return toast.error("Quantidade solicitada fora de estoque");
      const updateProduct = cart.map((item) => {
        if (item.id === productId) {
          return { ...item, amount: amount };
        } else {
          return item;
        }
      });
      setCart(updateProduct);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateProduct));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
