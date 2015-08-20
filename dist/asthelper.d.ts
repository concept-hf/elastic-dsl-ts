/// <reference path="E:/elastic-dsl-ts/src/ElasticDslBuilder/typings/tsd.d.ts" />
export declare class AstVisitor {
    visitChain: ESTree.Node[];
    protected visit(node: ESTree.Node): string;
    protected visitProgram(node: ESTree.Program): string;
    protected visitBinary(node: ESTree.BinaryExpression): string;
    protected visitUnary(node: ESTree.UnaryExpression): string;
    protected visitMember(node: ESTree.MemberExpression): string;
    protected visitLogical(node: ESTree.LogicalExpression): string;
    protected visitExpression(node: ESTree.ExpressionStatement): string;
    protected visitReturn(node: ESTree.ReturnStatement): string;
    protected visitFunctionExpression(node: ESTree.FunctionExpression): string;
    protected visitBlockStatement(node: ESTree.BlockStatement): string;
    protected visitIdentifier(node: ESTree.Identifier): string;
    protected visitLiteral(node: ESTree.Literal): string;
    protected visitProperty(node: ESTree.Property): string;
}
export declare class PropertyVisitor extends AstVisitor {
    static getProperty(fn: any, omitFirst?: boolean): string;
    property: string;
    constructor(func: any);
    protected visitMember(node: ESTree.MemberExpression): string;
}
