# Contributing to PurgeQ

## Welcome! 👋

Thank you for your interest in contributing to PurgeQ. This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and professional. We welcome people of all backgrounds and experience levels.

## Getting Started

### 1. Fork & Clone
```bash
git clone https://github.com/yourusername/PurgeQ.git
cd PurgeQ
```

### 2. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Set Up Development Environment
```bash
# See QUICKSTART.md for detailed setup
./setup.sh
```

## Development Guidelines

### Code Style

**Python:**
- Follow PEP 8
- Use type hints
- Max line length: 100 characters
- Use async/await for I/O operations

```python
async def get_items(db: AsyncSession) -> list[ItemResponse]:
    """Get all items with proper typing."""
    result = await db.execute(select(Item))
    return [ItemResponse.model_validate(item) for item in result.scalars()]
```

**TypeScript/React:**
- Use strict type checking
- Prefer functional components with hooks
- Use descriptive variable names

```typescript
interface PlayerProps {
  name: string;
  banned: boolean;
}

const PlayerComponent: React.FC<PlayerProps> = ({ name, banned }) => {
  return <div>{banned ? '🚫' : '✓'} {name}</div>;
};
```

### Testing

All code must have tests:

```python
@pytest.mark.asyncio
async def test_create_item(test_db_session):
    """Test creating an item."""
    service = ItemService(test_db_session)
    result = await service.create(ItemCreate(...))
    assert result.id is not None
```

Run tests before committing:
```bash
pytest tests/ -v
```

### Linting & Formatting

Format code before committing:
```bash
# Python
make format
black api tests

# TypeScript
cd extension
npm run format
```

Check for issues:
```bash
# Python
ruff check api tests

# TypeScript
npm run lint
```

## Commit Guidelines

Use clear, descriptive commit messages:

```
feat: Add player ban reason to API response
  - Include reason field in BanlistItemResponse
  - Update schema validation
  - Add test cases

fix: Fix case-insensitive player name lookup
  - Use lowercase keys in banlist map
  - Fix SQL query for case-insensitive matching

docs: Update API documentation

chore: Update dependencies
```

Format: `<type>: <subject>`

Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style (formatting)
- `refactor:` - Code refactoring
- `perf:` - Performance improvement
- `test:` - Adding tests
- `chore:` - Build, dependencies, etc.

## Pull Request Process

### 1. Create PR with Description
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Backend tests pass
- [ ] Extension builds
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No breaking changes
```

### 2. Automated Checks
- All tests must pass
- Linting must pass
- Code coverage should not decrease
- Docker image must build

### 3. Code Review
- Address reviewer feedback
- Discuss changes respectfully
- Ask for clarification if needed

### 4. Merge
- Squash commits if requested
- Delete feature branch
- Update CHANGELOG if needed

## Reporting Bugs

### Bug Report Template
```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Do this
2. Then this
3. Bug occurs

## Expected Behavior
What should happen

## Actual Behavior
What actually happened

## Environment
- OS: [Windows/Mac/Linux]
- Python: 3.12.x
- Browser: Chrome 120

## Logs/Screenshots
Attach relevant logs or screenshots
```

## Feature Requests

### Feature Request Template
```markdown
## Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should it work?

## Alternative Solutions
Any alternatives considered?
```

## Architecture Decisions

Before making architectural changes:

1. **Create an issue** discussing the change
2. **Add design document** in PR description
3. **Get approval** from maintainers
4. **Update documentation** (ARCHITECTURE.md)

## Database Migrations

When changing the schema:

```bash
# Create migration
alembic revision --autogenerate -m "Add field to users"

# Edit migration file to ensure correctness

# Test locally
docker-compose up -d
alembic upgrade head

# Test downgrade
alembic downgrade -1
alembic upgrade head
```

## API Changes

When modifying API endpoints:

1. **Version your changes** (`/api/v2/...`)
2. **Maintain backward compatibility** when possible
3. **Update OpenAPI schema**
4. **Update tests and documentation**
5. **Add migration guide** for clients

## Performance Considerations

When optimizing:

1. **Measure first**: Use profiling tools
2. **Document baseline**: Record before metrics
3. **Verify improvement**: Measure after changes
4. **Add tests**: Prevent regression

Example:
```python
import timeit

# Before: 0.542 seconds
# After: 0.142 seconds
# Improvement: ~73%

def benchmark():
    # your code
    pass

time = timeit.timeit(benchmark, number=1000)
```

## Security Considerations

When adding features:

- [ ] Input validation
- [ ] SQL injection prevention (use ORM)
- [ ] Authentication/Authorization
- [ ] Rate limiting
- [ ] HTTPS enforcement
- [ ] Secure defaults

## Documentation

Update docs for:

- New endpoints/features
- API changes
- Configuration options
- Troubleshooting guides

## Questions?

- Open an issue for questions
- Check existing issues/discussions
- Review [ARCHITECTURE.md](ARCHITECTURE.md)
- Check [DEPLOYMENT.md](DEPLOYMENT.md)

## Release Process

Maintainers only:

```bash
# Tag release
git tag v1.2.3
git push origin v1.2.3

# GitHub Actions will:
# - Run all tests
# - Build docker image
# - Create release

# Verify deployment
curl https://api.example.com/health
```

## License

By contributing, you agree your code will be licensed under MIT.

---

Thank you for contributing to PurgeQ! 🎉
