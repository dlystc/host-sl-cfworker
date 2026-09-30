import { OpenAPIRoute, contentJson } from "chanfana";
import { z } from "zod";
import { AppContext } from "../../types/context";
import { refillPoolIfNeeded } from "../../refill";

export class RefillPool extends OpenAPIRoute {
	schema = {
		tags: ["Sentences", "Admin"],
		summary: "Check Redis pool and refill if below threshold",
		responses: {
			"200": {
				description: "Refill report",
				...contentJson(z.object({
					success: z.boolean(),
					filled: z.boolean().describe("Whether a refill was actually performed"),
					previousCount: z.number().describe("Redis pool size before refill"),
					newCount: z.number().describe("Redis pool size after refill"),
					cycles: z.number().describe("Number of batch cycles executed"),
					fillCount: z.number().describe("Total entries added"),
				})),
			},
		},
	};

	async handle(c: AppContext) {
		const report = await refillPoolIfNeeded();
		return {
			success: true,
			...report,
		};
	}
}