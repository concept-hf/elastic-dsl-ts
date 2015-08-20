module ElasticDsl {
    export class AstVisitor {
        public visitChain: ESTree.Node[] = [];

        protected visit(node: ESTree.Node): string {
            this.visitChain.push(node);
            var result: string;
            switch (node.type) {
            case esprima.Syntax.Program:
                result = this.visitProgram(<ESTree.Program>node)
                break;
            case esprima.Syntax.BinaryExpression:
                result = this.visitBinary(<ESTree.BinaryExpression>node);
                break;
            case esprima.Syntax.UnaryExpression:
                result = this.visitUnary(<ESTree.UnaryExpression>node);
                break;
            case esprima.Syntax.MemberExpression:
                result = this.visitMember(<ESTree.MemberExpression>node);
                break;
            case esprima.Syntax.ExpressionStatement:
                result = this.visitExpression(<ESTree.ExpressionStatement>node);
                break;
            case esprima.Syntax.FunctionExpression:
                result = this.visitFunctionExpression(<ESTree.FunctionExpression>node);
                break;
            case esprima.Syntax.BlockStatement:
                result = this.visitBlockStatement(<ESTree.BlockStatement>node);
                break;
            case esprima.Syntax.ReturnStatement:
                result = this.visitReturn(<ESTree.ReturnStatement>node);
                break;
            case esprima.Syntax.Identifier:
                result = this.visitIdentifier(<ESTree.Identifier>node);
                break;
            case esprima.Syntax.Literal:
                result = this.visitLiteral(<ESTree.Literal>node);
                break;
            case esprima.Syntax.Property:
                result = this.visitProperty(<ESTree.Property>node);
                break;
            default:
                throw new Error("Invalid node type " + node.type);
            }

            this.visitChain.pop();
            return result;
        }

        protected visitProgram(node: ESTree.Program): string {
            return node.body.map(d => this.visit(d)).join();
        }

        protected visitBinary(node: ESTree.BinaryExpression): string {
            this.visit(node.left);
            this.visit(node.right);
            return "";
        }

        protected visitUnary(node: ESTree.UnaryExpression): string {
            this.visit(node.argument);
            return "";
        }

        protected visitMember(node: ESTree.MemberExpression): string {
            this.visit(node.object);
            this.visit(node.property);
            return "";
        }

        protected visitLogical(node: ESTree.LogicalExpression) {
            this.visit(node.left);
            this.visit(node.right);
            return "";
        }

        protected visitExpression(node: ESTree.ExpressionStatement) {
            return this.visit(node.expression);
        }

        protected visitReturn(node: ESTree.ReturnStatement): string {
            return this.visit(node.argument);
        }

        protected visitFunctionExpression(node: ESTree.FunctionExpression): string {
            return this.visit(node.body);
        }

        protected visitBlockStatement(node: ESTree.BlockStatement): string {
            node.body.forEach(d => this.visit(d));
            return "";
        }

        protected visitIdentifier(node: ESTree.Identifier): string {
            return "";
        }

        protected visitLiteral(node: ESTree.Literal): string {
            return "";
        }

        protected visitProperty(node: ESTree.Property): string {
            return "";
        }
    }

    export class PropertyVisitor extends AstVisitor {
        public static getProperty(fn: any, omitFirst: boolean = true) {
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

        property: string;

        constructor(func: any) {
            super();
            var tree = esprima.parse("(" + func.toString() + ")");
            this.visit(tree);
        }

        protected visitMember(node: ESTree.MemberExpression): string {
            this.property = node.property + '.' + node.property;
            this.visit(node.object);
            return "";
        }
    }
}