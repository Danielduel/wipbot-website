import { JSX, FunctionalComponent } from "preact";


const Link: FunctionalComponent<{ to: string}> = ({ children, to }) => {
  return (
    <a href={to} class="text-gray-400 first:pl-0 px-4 text-lg hover:text-white py-2 pt-4 inline-block">{children}</a>
  );
}

export function Header(props: JSX.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      class="w-full"
      {...props}
    >
      <div class="container mx-auto">
        <Link to="/">Home</Link>
        <Link to="/new">New upload form</Link>
        <Link to="https://statistics.wipbot.com/">Stats</Link>
      </div>
    </div>
  );
}
