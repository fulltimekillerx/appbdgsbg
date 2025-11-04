import { useRouter } from 'next/router';

export default function RollDetails() {
  const router = useRouter();
  const { id } = router.query;

  // Fetch roll details based on the id

  return (
    <div>
      <h1>Roll Details: {id}</h1>
      {/* Display roll details here */}
    </div>
  );
}
