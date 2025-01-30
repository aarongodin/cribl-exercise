import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
	vus: 10,
	duration: "60s",
};

export default function () {
	const res = http.get("http://localhost:3000/files/system.log");
	check(res, {
		"is status 200": (r) => r.status === 200,
	});
}
