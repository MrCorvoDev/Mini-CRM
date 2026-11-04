export const round = (number: number, decimals = 2) => {
   const precise = 10 ** decimals;

   return Math.round(number * precise) / precise;
};
