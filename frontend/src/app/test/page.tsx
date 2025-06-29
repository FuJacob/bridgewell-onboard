"use client";
import { useState } from "react";
const Page = () => {
  const [loginKey, setLoginKey] = useState("");
  const [clientName, setClientName] = useState("");
  const [result, setResult] = useState("");
  const deleteClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch("/api/admin/delete-client", {
      method: "DELETE",
      body: JSON.stringify({ loginKey, clientName }),
    });
    const data = await response.json();
    console.log(data);
    if (response.ok) {
      setResult("DELETED");
      setTimeout(() => {
        setResult("");
      }, 1000);
    } else {
      setResult("FAILED");
      setTimeout(() => {
        setResult("");
      }, 1000);
    }
  };
  return (
    <form onSubmit={deleteClient} className="flex flex-col gap-2">
      <input
        type="text"
        name="loginKey"
        value={loginKey}
        onChange={(e) => setLoginKey(e.target.value)}
      />
      <input
        type="text"
        name="clientName"
        value={clientName}
        onChange={(e) => setClientName(e.target.value)}
      />
      <button type="submit">Delete</button>
      {result && <p>{result}</p>}
    </form>
  );
};

export default Page;
