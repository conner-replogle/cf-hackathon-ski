

export default function Watch() {
  const { eventId } = useParams<{ eventId: string }>();
  const currentEventId = eventId ? parseInt(eventId, 10) : null;



  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      
    </div>
  );
}