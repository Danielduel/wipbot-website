import { define } from "../../utils.ts";

export const handler = define.handlers({
  GET(ctx) {
    return ctx.render(<div>Hello {ctx.params.name}</div>);
  }
})
