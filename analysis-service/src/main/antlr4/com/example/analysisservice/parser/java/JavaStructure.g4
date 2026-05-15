grammar JavaStructure;

// =====================================================================
// PARSER RULES
// =====================================================================

compilationUnit
    : packageDeclaration? importDeclaration* typeDeclaration* EOF
    ;

packageDeclaration
    : annotation* 'package' qualifiedName ';'
    ;

importDeclaration
    : 'import' 'static'? qualifiedName ('.' '*')? ';'
    ;

typeDeclaration
    : classDeclaration
    | enumDeclaration
    | interfaceDeclaration
    | recordDeclaration
    | annotationTypeDeclaration
    | ';'
    ;

// ---- Modifiers ----

modifier
    : annotation
    | 'public' | 'protected' | 'private'
    | 'static' | 'abstract' | 'final' | 'sealed' | 'non-sealed'
    | 'native' | 'synchronized' | 'transient' | 'volatile' | 'strictfp'
    | 'default'
    ;

// ---- Class ----

classDeclaration
    : modifier* 'class' IDENTIFIER typeParameters?
      ('extends' typeType)?
      ('implements' typeList)?
      ('permits' qualifiedNameList)?
      classBody
    ;

classBody
    : LBRACE classBodyDeclaration* RBRACE
    ;

classBodyDeclaration
    : ';'
    | 'static'? block
    | modifier* memberDeclaration
    ;

memberDeclaration
    : fieldDeclaration
    | methodDeclaration
    | constructorDeclaration
    | classDeclaration
    | enumDeclaration
    | interfaceDeclaration
    | recordDeclaration
    | annotationTypeDeclaration
    ;

methodDeclaration
    : typeParameters? typeTypeOrVoid IDENTIFIER formalParameters (LBRACK RBRACK)*
      ('throws' qualifiedNameList)?
      (block | ';')
    ;

constructorDeclaration
    : typeParameters? IDENTIFIER formalParameters
      ('throws' qualifiedNameList)?
      block
    ;

fieldDeclaration
    : typeType variableDeclarators ';'
    ;

variableDeclarators
    : variableDeclarator (COMMA variableDeclarator)*
    ;

variableDeclarator
    : IDENTIFIER (LBRACK RBRACK)* ('=' variableInitializer)?
    ;

variableInitializer
    : arrayInitializer
    | exprTokens
    ;

arrayInitializer
    : LBRACE (variableInitializer (COMMA variableInitializer)*)? COMMA? RBRACE
    ;

// ---- Interface ----

interfaceDeclaration
    : modifier* 'interface' IDENTIFIER typeParameters?
      ('extends' typeList)?
      ('permits' qualifiedNameList)?
      interfaceBody
    ;

interfaceBody
    : LBRACE interfaceBodyDeclaration* RBRACE
    ;

interfaceBodyDeclaration
    : modifier* interfaceMemberDeclaration
    | ';'
    ;

interfaceMemberDeclaration
    : constDeclaration
    | interfaceMethodDeclaration
    | classDeclaration
    | enumDeclaration
    | interfaceDeclaration
    | recordDeclaration
    | annotationTypeDeclaration
    ;

constDeclaration
    : typeType constantDeclarator (COMMA constantDeclarator)* ';'
    ;

constantDeclarator
    : IDENTIFIER (LBRACK RBRACK)* '=' variableInitializer
    ;

interfaceMethodDeclaration
    : typeParameters? typeTypeOrVoid IDENTIFIER formalParameters (LBRACK RBRACK)*
      ('throws' qualifiedNameList)?
      (block | ';')
    ;

// ---- Enum ----

enumDeclaration
    : modifier* 'enum' IDENTIFIER ('implements' typeList)?
      LBRACE enumConstants? COMMA? (';' classBodyDeclaration*)? RBRACE
    ;

enumConstants
    : enumConstant (COMMA enumConstant)*
    ;

enumConstant
    : annotation* IDENTIFIER enumConstantArgs? classBody?
    ;

enumConstantArgs
    : LPAREN enumArgContent* RPAREN
    ;

enumArgContent
    : LPAREN enumArgContent* RPAREN
    | LBRACK enumArgContent* RBRACK
    | LBRACE enumArgContent* RBRACE
    | ~(LPAREN | RPAREN | LBRACK | RBRACK | LBRACE | RBRACE)
    ;

// ---- Record ----

recordDeclaration
    : modifier* 'record' IDENTIFIER typeParameters?
      LPAREN recordComponents? RPAREN
      ('implements' typeList)?
      LBRACE classBodyDeclaration* RBRACE
    ;

recordComponents
    : recordComponent (COMMA recordComponent)*
    ;

recordComponent
    : annotation* typeType IDENTIFIER
    ;

// ---- Annotation type ----

annotationTypeDeclaration
    : modifier* '@' 'interface' IDENTIFIER
      LBRACE annotationTypeElementDeclaration* RBRACE
    ;

annotationTypeElementDeclaration
    : modifier* annotationTypeElementRest
    | ';'
    ;

annotationTypeElementRest
    : typeType IDENTIFIER LPAREN RPAREN (LBRACK RBRACK)* ('default' elementValue)? ';'
    | typeType variableDeclarators ';'
    | classDeclaration
    | interfaceDeclaration
    | enumDeclaration
    | annotationTypeDeclaration
    ;

elementValue
    : annotation
    | LBRACE (elementValue (COMMA elementValue)*)? COMMA? RBRACE
    | exprTokens
    ;

// ---- Annotations ----

annotation
    : '@' qualifiedName (LPAREN annotationArgs? RPAREN)?
    ;

annotationArgs
    : elementValuePair (COMMA elementValuePair)*
    | elementValue
    ;

elementValuePair
    : IDENTIFIER '=' elementValue
    ;

// ---- Type system ----

typeTypeOrVoid
    : typeType
    | 'void'
    ;

typeType
    : annotation* (classOrInterfaceType | primitiveType) (annotation* LBRACK RBRACK)*
    ;

classOrInterfaceType
    : IDENTIFIER typeArguments? ('.' IDENTIFIER typeArguments?)*
    ;

primitiveType
    : 'boolean' | 'char' | 'byte' | 'short'
    | 'int' | 'long' | 'float' | 'double'
    ;

// Note: >> is NOT defined as a single token so Map<List<String>> parses correctly
// as GT GT, not RSHIFT.
typeArguments
    : '<' typeArgument (COMMA typeArgument)* '>'
    ;

typeArgument
    : typeType
    | annotation* '?' (('extends' | 'super') typeType)?
    ;

typeParameters
    : '<' typeParameter (COMMA typeParameter)* '>'
    ;

typeParameter
    : annotation* IDENTIFIER ('extends' annotation* typeBound)?
    ;

typeBound
    : typeType ('&' typeType)*
    ;

typeList
    : typeType (COMMA typeType)*
    ;

qualifiedName
    : IDENTIFIER ('.' IDENTIFIER)*
    ;

qualifiedNameList
    : qualifiedName (COMMA qualifiedName)*
    ;

// ---- Formal parameters ----

formalParameters
    : LPAREN formalParameterList? RPAREN
    ;

formalParameterList
    : formalParameter (COMMA formalParameter)* (COMMA lastFormalParameter)?
    | lastFormalParameter
    ;

formalParameter
    : modifier* typeType IDENTIFIER (LBRACK RBRACK)*
    ;

lastFormalParameter
    : modifier* typeType annotation* '...' IDENTIFIER (LBRACK RBRACK)*
    ;

// ---- Block: body content is skipped (balanced braces) ----

block
    : LBRACE blockContent* RBRACE
    ;

blockContent
    : block
    | ~(LBRACE | RBRACE)
    ;

// ---- Expression tokens: consume initializers without full expression parsing ----

exprTokens
    : exprToken+
    ;

exprToken
    : LPAREN exprInner* RPAREN
    | LBRACK exprInner* RBRACK
    | ~(LPAREN | RPAREN | LBRACK | RBRACK | LBRACE | RBRACE | COMMA | SEMI)
    ;

exprInner
    : LPAREN exprInner* RPAREN
    | LBRACK exprInner* RBRACK
    | LBRACE exprInner* RBRACE
    | ~(LPAREN | RPAREN | LBRACK | RBRACK | LBRACE | RBRACE)
    ;

// =====================================================================
// LEXER RULES
// =====================================================================

// Named tokens used in ~ (set complement) expressions above
LBRACE   : '{' ;
RBRACE   : '}' ;
LPAREN   : '(' ;
RPAREN   : ')' ;
LBRACK   : '[' ;
RBRACK   : ']' ;
SEMI     : ';' ;
COMMA    : ',' ;

// Other separators / operators
DOT      : '.' ;
ELLIPSIS : '...' ;
AT       : '@' ;
COLONCOLON : '::' ;
ARROW    : '->' ;
QUESTION : '?' ;
COLON    : ':' ;

// Comparison / assignment (GE and LE before GT and LT for maximal munch)
EQUAL    : '==' ;
NOTEQUAL : '!=' ;
GE       : '>=' ;
LE       : '<=' ;
GT       : '>' ;
LT       : '<' ;

// Logical
AND : '&&' ;
OR  : '||' ;

// Arithmetic / bitwise (compound before simple for maximal munch)
INC         : '++' ;
DEC         : '--' ;
ADD_ASSIGN  : '+=' ;
SUB_ASSIGN  : '-=' ;
MUL_ASSIGN  : '*=' ;
DIV_ASSIGN  : '/=' ;
AND_ASSIGN  : '&=' ;
OR_ASSIGN   : '|=' ;
XOR_ASSIGN  : '^=' ;
MOD_ASSIGN  : '%=' ;
LSHIFT_ASSIGN : '<<=' ;
LSHIFT      : '<<' ;
ASSIGN      : '=' ;
ADD         : '+' ;
SUB         : '-' ;
MUL         : '*' ;
DIV         : '/' ;
MOD         : '%' ;
BITAND      : '&' ;
BITOR       : '|' ;
CARET       : '^' ;
TILDE       : '~' ;
BANG        : '!' ;

// Literals
IntegerLiteral
    : ('0' | [1-9] [0-9_]*) [lL]?
    | '0' [xX] [0-9a-fA-F] ([0-9a-fA-F_]* [0-9a-fA-F])? [lL]?
    | '0' [bB] [01] ([01_]* [01])? [lL]?
    | '0' [0-7_]+ [lL]?
    ;

FloatingPointLiteral
    : [0-9] [0-9_]* '.' [0-9_]* ExponentPart? FloatSuffix?
    | '.' [0-9] [0-9_]* ExponentPart? FloatSuffix?
    | [0-9] [0-9_]* ExponentPart FloatSuffix?
    | [0-9] [0-9_]* FloatSuffix
    ;

CharacterLiteral : '\'' (~['\\\n\r] | EscapeSequence) '\'' ;

StringLiteral : '"' (~["\\\n\r] | EscapeSequence)* '"' ;

TextBlock : '"""' [ \t]* [\r\n] .*? '"""' ;

// Identifier — must come after all keyword string literals (ANTLR4 handles ordering)
IDENTIFIER : [a-zA-Z_$] [a-zA-Z_$0-9]* ;

// Whitespace and comments — skipped
WS           : [ \t\r\n]+ -> skip ;
COMMENT      : '/*' .*? '*/'    -> skip ;
LINE_COMMENT : '//' ~[\r\n]*    -> skip ;

fragment ExponentPart : [eE] [+-]? [0-9]+ ;
fragment FloatSuffix  : [fFdD] ;
fragment EscapeSequence
    : '\\' [btnfr"'\\0]
    | '\\' [0-7] [0-7]?
    | '\\' [0-3] [0-7] [0-7]
    | '\\u' [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F]
    ;
