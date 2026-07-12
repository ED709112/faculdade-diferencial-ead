const { body, param, query, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Erro de validação',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

const authValidators = {
  register: [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório.')
      .isLength({ min: 2, max: 255 }).withMessage('Nome deve ter entre 2 e 255 caracteres.'),
    body('email').isEmail().withMessage('E-mail inválido.').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Senha deve ter pelo menos 8 caracteres.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Senha deve conter ao menos: 1 letra maiúscula, 1 minúscula e 1 número.'),
    body('phone').optional().matches(/^\(\d{2}\)\s?\d{4,5}-\d{4}$/).withMessage('Formato de telefone inválido.'),
    body('lgpd_consent').equals('true').withMessage('É necessário aceitar a LGPD.'),
    handleValidation
  ],

  login: [
    body('email').isEmail().withMessage('E-mail inválido.').normalizeEmail(),
    body('password').notEmpty().withMessage('Senha é obrigatória.'),
    handleValidation
  ],

  forgotPassword: [
    body('email').isEmail().withMessage('E-mail inválido.').normalizeEmail(),
    handleValidation
  ],

  resetPassword: [
    body('token').notEmpty().withMessage('Token é obrigatório.'),
    body('password').isLength({ min: 8 }).withMessage('Senha deve ter pelo menos 8 caracteres.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Senha deve conter ao menos: 1 letra maiúscula, 1 minúscula e 1 número.'),
    handleValidation
  ]
};

const courseValidators = {
  create: [
    body('title').trim().notEmpty().withMessage('Título é obrigatório.')
      .isLength({ max: 500 }).withMessage('Título deve ter no máximo 500 caracteres.'),
    body('price').isFloat({ min: 0 }).withMessage('Preço deve ser um valor positivo.'),
    body('workload').isInt({ min: 1 }).withMessage('Carga horária deve ser um número positivo.'),
    body('category_id').optional({ nullable: true }).isInt().withMessage('Categoria inválida.'),
    handleValidation
  ],

  update: [
    param('id').isInt().withMessage('ID do curso inválido.'),
    body('title').optional().trim().notEmpty().withMessage('Título não pode ser vazio.'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Preço deve ser um valor positivo.'),
    handleValidation
  ]
};

const userValidators = {
  updateProfile: [
    body('name').optional().trim().isLength({ min: 2, max: 255 }).withMessage('Nome deve ter entre 2 e 255 caracteres.'),
    body('phone').optional().matches(/^\(\d{2}\)\s?\d{4,5}-\d{4}$/).withMessage('Formato de telefone inválido.'),
    body('cpf').optional().matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/).withMessage('Formato de CPF inválido.'),
    body('birth_date').optional().isDate().withMessage('Data de nascimento inválida.'),
    handleValidation
  ],

  changePassword: [
    body('current_password').notEmpty().withMessage('Senha atual é obrigatória.'),
    body('new_password').isLength({ min: 8 }).withMessage('Nova senha deve ter pelo menos 8 caracteres.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Nova senha deve conter ao menos: 1 letra maiúscula, 1 minúscula e 1 número.'),
    handleValidation
  ]
};

const enrollmentValidators = {
  enroll: [
    body('course_id').isInt().withMessage('ID do curso inválido.'),
    body('coupon_code').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Cupom inválido.'),
    handleValidation
  ]
};

const quizValidators = {
  submit: [
    body('quiz_id').isInt().withMessage('ID da prova inválido.'),
    body('answers').isArray({ min: 1 }).withMessage('Respostas são obrigatórias.'),
    body('answers.*.question_id').isInt().withMessage('ID da questão inválido.'),
    handleValidation
  ]
};

const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número positivo.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100.'),
  handleValidation
];

module.exports = {
  handleValidation,
  authValidators,
  courseValidators,
  userValidators,
  enrollmentValidators,
  quizValidators,
  paginationValidator
};
