import { BooksBuilder } from "../../../../components/books-builder";
export default function Page({ params }: { params: { id: string } }) { return <BooksBuilder kind="quote" editId={params.id} />; }
