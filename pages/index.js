import Head from "next/head";
import GenerateForm from "../components/GenerateForm";

export default function Home() {
  return (
    <div className="container max-w-2xl mx-auto p-5">
      <Head>
        <title>Talking Heads</title>
      </Head>

      <h1 className="py-6 text-center font-bold text-2xl">
        Talking Heads
      </h1>

      <GenerateForm />
    </div>
  );
}
