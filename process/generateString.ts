export const generateStringDefaultSeed = () => Math.floor(Math.random() * Date.now());

export const generateString = (
  length: number = 5,
  seed: number = generateStringDefaultSeed()
) => {
  const characters = "0123456789ABCDEF"; // GHIJKLMNOPQRSTUVWXYZ";
  const index = () => {
    const x = Math.sin(seed++) * 1000;
    const randomish = x - Math.floor(x);
    return Math.floor(randomish * characters.length);
  };
  const arr = new Array(length).fill("").map(() => characters[index()]);

  return arr.join("");
};

export const createGenerateString = (length: number) => {
  return () => generateString(length, generateStringDefaultSeed());
}

