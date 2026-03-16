import { runBackgroundScript } from "@/background/runBackgroundScript";

export default defineBackground({
    main() {
        runBackgroundScript();
    },
});
