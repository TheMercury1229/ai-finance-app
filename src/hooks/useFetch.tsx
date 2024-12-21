import { useState } from "react";
import { toast } from "sonner";

const useFetch = (cb: (...args: any[]) => void) => {
  const [data, setData] = useState<any>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fn = async (...args: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await cb(...args);
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  return { data, loading, error, fn, setData };
};

export default useFetch;
