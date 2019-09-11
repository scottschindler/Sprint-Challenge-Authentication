const request = require("supertest");
const server = require("./server.js");

describe("server.js", () => {
  describe("GET /", () => {
    it("should return 200 ok", async () => {
      const res = await request(server).get("/");
      expect(res.status).toBe(200);
    });

    it("should return a json object", async () => {
      const res = await request(server).get("/");
      expect(res.type).toBe("application/json");
    });
  });
});
