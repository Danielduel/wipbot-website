import { type PageProps } from "fresh";
export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Wipbot</title>
      </head>
      <body class="p-0 m-0 bg-[#3b4252]">
        <Component />
      </body>
    </html>
  );
}
