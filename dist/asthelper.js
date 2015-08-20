/// <reference path="./typings/tsd.d.ts"/>
export class AstVisitor {
    constructor() {
        this.visitChain = [];
    }
    visit(node) {
        this.visitChain.push(node);
        var result;
        switch (node.type) {
            case esprima.Syntax.Program:
                result = this.visitProgram(node);
                break;
            case esprima.Syntax.BinaryExpression:
                result = this.visitBinary(node);
                break;
            case esprima.Syntax.UnaryExpression:
                result = this.visitUnary(node);
                break;
            case esprima.Syntax.MemberExpression:
                result = this.visitMember(node);
                break;
            case esprima.Syntax.ExpressionStatement:
                result = this.visitExpression(node);
                break;
            case esprima.Syntax.FunctionExpression:
                result = this.visitFunctionExpression(node);
                break;
            case esprima.Syntax.BlockStatement:
                result = this.visitBlockStatement(node);
                break;
            case esprima.Syntax.ReturnStatement:
                result = this.visitReturn(node);
                break;
            case esprima.Syntax.Identifier:
                result = this.visitIdentifier(node);
                break;
            case esprima.Syntax.Literal:
                result = this.visitLiteral(node);
                break;
            case esprima.Syntax.Property:
                result = this.visitProperty(node);
                break;
            default:
                throw new Error("Invalid node type " + node.type);
        }
        this.visitChain.pop();
        return result;
    }
    visitProgram(node) {
        return node.body.map(d => this.visit(d)).join();
    }
    visitBinary(node) {
        this.visit(node.left);
        this.visit(node.right);
        return "";
    }
    visitUnary(node) {
        this.visit(node.argument);
        return "";
    }
    visitMember(node) {
        this.visit(node.object);
        this.visit(node.property);
        return "";
    }
    visitLogical(node) {
        this.visit(node.left);
        this.visit(node.right);
        return "";
    }
    visitExpression(node) {
        return this.visit(node.expression);
    }
    visitReturn(node) {
        return this.visit(node.argument);
    }
    visitFunctionExpression(node) {
        return this.visit(node.body);
    }
    visitBlockStatement(node) {
        node.body.forEach(d => this.visit(d));
        return "";
    }
    visitIdentifier(node) {
        return "";
    }
    visitLiteral(node) {
        return "";
    }
    visitProperty(node) {
        return "";
    }
}
export class PropertyVisitor extends AstVisitor {
    constructor(func) {
        super();
        var tree = esprima.parse("(" + func.toString() + ")");
        this.visit(tree);
    }
    static getProperty(fn, omitFirst = true) {
        var visitor = new PropertyVisitor(fn);
        var property = visitor.property;
        if (omitFirst) {
            var dotIndex = property.indexOf('.');
            if (dotIndex > 0) {
                property = property.slice(dotIndex + 1);
            }
        }
        return property;
    }
    visitMember(node) {
        this.property = node.property + '.' + node.property;
        this.visit(node.object);
        return "";
    }
}
//# sourceMappingURL=asthelper.js.map