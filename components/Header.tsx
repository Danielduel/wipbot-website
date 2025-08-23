import { FunctionalComponent, JSX } from "preact";

const Link: FunctionalComponent<{ href: string; target?: string }> = (
  { children, href, target },
) => {
  return (
    <a
      href={href}
      target={target}
      class="text-gray-400 first:pl-0 px-4 text-lg hover:text-white py-2 pt-4 inline-block"
    >
      {children}
    </a>
  );
};

export function Header(props: JSX.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      class="w-full"
      {...props}
    >
      <div class="container mx-auto">
        <Link href="/">Home</Link>
        <Link href="/old">Old upload form</Link>
        <Link href="https://statistics.wipbot.com/" target="_blank">Stats</Link>
        <Link href="https://bsmg.wiki/mapping/basic-mapping.html" target="_blank">
          Mapping guide
        </Link>
        <Link href="https://github.com/Danielduel/wipbot/releases/tag/1.20.0" target="_blank">
          Latest mod release
        </Link>
      </div>
    </div>
  );
}
