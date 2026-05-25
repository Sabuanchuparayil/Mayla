export default function CategoryPill({ category }: { category: string }) {
  const lower = category.toLowerCase();
  const styles: Record<string, string> = {
    harassment: 'bg-red-50 text-red-700',
    spam: 'bg-orange-50 text-orange-700',
    fake: 'bg-yellow-50 text-yellow-700',
    inappropriate: 'bg-pink-50 text-pink-700',
    underage: 'bg-purple-50 text-purple-700',
    scam: 'bg-amber-50 text-amber-700',
  };
  const style = styles[lower] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {category}
    </span>
  );
}
