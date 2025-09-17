import { Head } from "fresh/runtime";
import { HttpError } from "fresh";

const Error404 = () => {
  return (
    <>
      <Head>
        <title>404 - Page not found</title>
      </Head>
      <h1 class="text-4xl font-bold text-white">404 - Page not found</h1>
      <a href="/" class="underline text-white">Go back home</a>
    </>
  );
}

export default function ErrorPage(props) {
  console.log(props);
  
  const error = props.error; // Contains the thrown Error or HTTPError
  if (error instanceof HttpError) {
    const status = error.status; // HTTP status code

    // Render a 404 not found page
    if (status === 404) {
      return <Error404 />;
    }

  }

  console.log(error);
}

