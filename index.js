require("react-native-get-random-values");
global.Buffer = require("buffer").Buffer;

const { registerRootComponent } = require("expo");
const App = require("./src/App").default;

registerRootComponent(App);
