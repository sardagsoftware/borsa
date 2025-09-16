import { useEffect, useState } from "react";
import { client } from "./client"; import { connect } from "./ws";

export function useFn<T=any>(name:string, args:any, deps:any[]=[]){
  const [data,setData] = useState<T|null>(null);
  const [error,setError] = useState<Error|null>(null);
  const [loading,setLoading] = useState(false);
  useEffect(()=>{ let alive=true; setLoading(true);
    client.call<T>(name,args).then(d=> alive && setData(d))
      .catch(e=> alive && setError(e))
      .finally(()=> alive && setLoading(false));
    return ()=>{ alive=false; };
  }, deps);
  return { data,error,loading };
}

export function useStream<T=any>(topic:string){
  const [msg,setMsg] = useState<T|null>(null);
  useEffect(()=> connect(topic,(m)=>setMsg(m.data)), [topic]);
  return msg;
}
