import RecipeList from "@/components/RecipeList";

export default function Mikilab() {
  return (
    <RecipeList
      collectionName="mikilab"
      heroImage="https://images.unsplash.com/photo-1675725291010-cb1020860cb2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxhcnRpc2FuJTIwc291cmRvdWdoJTIwYnJlYWQlMjBiYWtlcnklMjB3b29kJTIwb3ZlbiUyMGZsb3VyfGVufDB8fHx8MTc4Njk4MjgxOXww&ixlib=rb-4.1.0&q=85"
      heroTitle="Mikilab"
      heroSubtitle="Le tue ricette, sempre modificabili"
      emptyText="Nessuna ricetta. Tocca 'Aggiungi ricetta' per iniziare."
    />
  );
}
