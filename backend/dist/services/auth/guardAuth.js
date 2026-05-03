"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateGuard = void 0;
const shared_1 = require("./shared");
const authenticateGuard = (erpId, password) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, shared_1.authenticateFromTable)({
        tableName: "guards",
        role: "guard",
        idColumns: ["erpid", "erp_id", "guard_id"],
        nameColumns: ["name", "full_name"],
        passwordColumns: ["password_hash", "password"],
    }, erpId, password);
});
exports.authenticateGuard = authenticateGuard;
