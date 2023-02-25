module.exports = {
  '*.@(ts|tsx)': () => ['yarn type-check', 'yarn format']
}
