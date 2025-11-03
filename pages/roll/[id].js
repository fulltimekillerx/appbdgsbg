import { useRouter } from 'next/router';

export default function RollDetail() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div>
      <h1>Roll {id}</h1>
      {/* Add roll detail content here */}
    </div>
  );
}
