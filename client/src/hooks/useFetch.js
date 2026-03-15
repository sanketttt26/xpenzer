import { useDispatch, useSelector } from "react-redux";
import { setLoading, setError } from "../store/functions/ux";
import { useEffect, useState } from "react";

const getErrorMessage = (error) => {
  if (Array.isArray(error?.message)) {
    return error.message.join(", ");
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return "Something went wrong, please try again";
};

const useFetch = (fetcher, params = [], dispatcher, enabled = true) => {
  const [response, setResponse] = useState(null);
  const dispatch = useDispatch();
  const ux = useSelector((store) => store.ux);
  const paramsKey = JSON.stringify(params ?? null);

  useEffect(() => {
    if (!enabled) {
      setResponse(null);
      dispatch(setLoading(false));
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      dispatch(setLoading(true));
      dispatch(setError(""));

      try {
        const res = await fetcher(JSON.parse(paramsKey));
        if (!isMounted || !res) return;

        setResponse(res);

        if (dispatcher) {
          dispatch(dispatcher(res.data));
        }
      } catch (err) {
        if (!isMounted) return;

        dispatch(setError(getErrorMessage(err)));
      } finally {
        if (isMounted) {
          dispatch(setLoading(false));
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [dispatch, dispatcher, enabled, fetcher, paramsKey]);

  return { response: response?.data, loading: ux.loading };
};

export default useFetch;
