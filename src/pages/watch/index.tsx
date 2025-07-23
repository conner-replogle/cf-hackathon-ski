import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"



export function Watch(){
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const eventId = searchParams.get("event");
        if (!eventId) {
          navigate("/upload/event");
        }
    }, [searchParams]);
    
    return (
        <div>
            <h1>Watch</h1>
        </div>
    )
}