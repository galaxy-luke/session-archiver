# User Permission Management System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete user permission management system with CRUD operations for Users, Roles, and Permissions using Laravel + Filament with Spatie Permission package.

**Architecture:**
- Use Spatie Laravel Permission package (industry standard, works seamlessly with Filament)
- Three-tier model: Users → Roles → Permissions (many-to-many relationships)
- Filament Resources for admin management interface
- Database migrations for roles/permissions tables
- Seed initial admin roles and permissions

**Tech Stack:**
- Laravel 13, Filament 5.x
- spatie/laravel-permission
- Blade policies for permission checking

---

## Task 1: Install and Configure Spatie Permission Package

**Files:**
- Modify: `DAD-System/composer.json`
- Modify: `DAD-System/app/Models/User.php`
- Create: `DAD-System/database/migrations/2024_06_01_000001_add_permission_columns_to_users_table.php`

- [ ] **Step 1: Install spatie/laravel-permission package via composer**

```bash
cd DAD-System
composer require spatie/laravel-permission
```

Expected: Package installed successfully

- [ ] **Step 2: Publish and run migrations**

```bash
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan migrate
```

Expected: Creates tables: permissions, roles, model_has_permissions, model_has_roles, role_has_permissions

- [ ] **Step 3: Update User model to add HasRoles trait**

Open: `DAD-System/app/Models/User.php`

Replace entire file with:
```php
<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
```

- [ ] **Step 4: Clear config cache**

```bash
php artisan config:clear
php artisan optimize:clear
```

Expected: Config cache cleared

- [ ] **Step 5: Commit**

```bash
git add DAD-System/composer.json DAD-System/composer.lock DAD-System/app/Models/User.php
git commit -m "feat: install and configure spatie/laravel-permission"
```

---

## Task 2: Create UserResource with Role Management

**Files:**
- Create: `DAD-System/app/Filament/Resources/UserResource.php`
- Create: `DAD-System/app/Filament/Resources/UserResource/Pages/ListUsers.php`
- Create: `DAD-System/app/Filament/Resources/UserResource/Pages/CreateUser.php`
- Create: `DAD-System/app/Filament/Resources/UserResource/Pages/EditUser.php`

- [ ] **Step 1: Create UserResource with role assignment**

Create: `DAD-System/app/Filament/Resources/UserResource.php`

```php
<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserResource\Pages;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Hash;

class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static ?string $navigationIcon = 'heroicon-o-users';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('User Information')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\TextInput::make('email')
                            ->email()
                            ->required()
                            ->unique(ignoreRecord: true),
                        Forms\Components\TextInput::make('password')
                            ->password()
                            ->dehydrateStateUsing(fn ($state) => $state ? Hash::make($state) : null)
                            ->required(fn ($context) => $context === 'create')
                            ->dehydrated(fn ($state) => filled($state))
                            ->revealable(),
                        Forms\Components\TextInput::make('password_confirmation')
                            ->password()
                            ->dehydrated(false)
                            ->required(fn ($context, $get) => $context === 'create' || filled($get('password')))
                            ->same('password')
                            ->revealable(),
                    ])
                    ->columns(2),
                Forms\Components\Section::make('Roles & Permissions')
                    ->schema([
                        Forms\Components\CheckboxList::make('roles')
                            ->relationship('roles', 'name')
                            ->searchable()
                            ->bulkActionable()
                            ->optionsLabel(fn ($record) => str($record->name)->title()->toString())
                            ->helperText('Select roles for this user'),
                    ])
                    ->columns(1),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('email')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('roles.name')
                    ->badge()
                    ->color('primary')
                    ->separator(', '),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('roles')
                    ->relationship('roles', 'name')
                    ->multiple()
                    ->label('Filter by Roles'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->emptyStateHeading('No users found')
            ->emptyStateDescription('Create your first user to get started.');
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListUsers::route('/'),
            'create' => Pages\CreateUser::route('/create'),
            'edit' => Pages\EditUser::route('/{record}/edit'),
        ];
    }
}
```

- [ ] **Step 2: Create ListUsers page**

Create: `DAD-System/app/Filament/Resources/UserResource/Pages/ListUsers.php`

```php
<?php

namespace App\Filament\Resources\UserResource\Pages;

use App\Filament\Resources\UserResource;
use Filament\Resources\Pages\ListRecords;

class ListUsers extends ListRecords
{
    protected static string $resource = UserResource::class;

    protected function getHeaderActions(): array
    {
        return [
            //
        ];
    }
}
```

- [ ] **Step 3: Create CreateUser page**

Create: `DAD-System/app/Filament/Resources/UserResource/Pages/CreateUser.php`

```php
<?php

namespace App\Filament\Resources\UserResource\Pages;

use App\Filament\Resources\UserResource;
use Filament\Resources\Pages\CreateRecord;

class CreateUser extends CreateRecord
{
    protected static string $resource = UserResource::class;
}
```

- [ ] **Step 4: Create EditUser page**

Create: `DAD-System/app/Filament/Resources/UserResource/Pages/EditUser.php`

```php
<?php

namespace App\Filament\Resources\UserResource\Pages;

use App\Filament\Resources\UserResource;
use Filament\Resources\Pages\EditRecord;

class EditUser extends EditRecord
{
    protected static string $resource = UserResource::class;
}
```

- [ ] **Step 5: Commit**

```bash
git add DAD-System/app/Filament/Resources/UserResource
git commit -m "feat: create UserResource with role management"
```

---

## Task 3: Create RoleResource with Permission Management

**Files:**
- Create: `DAD-System/app/Filament/Resources/RoleResource.php`
- Create: `DAD-System/app/Filament/Resources/RoleResource/Pages/ListRoles.php`
- Create: `DAD-System/app/Filament/Resources/RoleResource/Pages/CreateRole.php`
- Create: `DAD-System/app/Filament/Resources/RoleResource/Pages/EditRole.php`

- [ ] **Step 1: Create RoleResource with permission assignment**

Create: `DAD-System/app/Filament/Resources/RoleResource.php`

```php
<?php

namespace App\Filament\Resources;

use App\Filament\Resources\RoleResource\Pages;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Role;

class RoleResource extends Resource
{
    protected static ?string $model = Role::class;

    protected static ?string $navigationIcon = 'heroicon-o-shield-check';

    protected static ?int $navigationSort = 2;

    protected static ?string $navigationGroup = 'Administration';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Role Information')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255),
                        Forms\Components\TextInput::make('guard_name')
                            ->default('web')
                            ->required()
                            ->maxLength(255),
                    ])
                    ->columns(2),
                Forms\Components\Section::make('Permissions')
                    ->schema([
                        Forms\Components\CheckboxList::make('permissions')
                            ->relationship('permissions', 'name')
                            ->searchable()
                            ->bulkActionable()
                            ->optionsLabel(fn ($record) => str($record->name)->replace('.', ' ')->title()->toString())
                            ->helperText('Select permissions for this role')
                            ->columns(3),
                    ])
                    ->columns(1),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->badge()
                    ->color('warning'),
                Tables\Columns\TextColumn::make('guard_name')
                    ->searchable()
                    ->sortable()
                    ->badge()
                    ->color('gray'),
                Tables\Columns\TextColumn::make('permissions.name')
                    ->badge()
                    ->color('primary')
                    ->separator(', ')
                    ->limitList(2)
                    ->expandableLimitList(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->emptyStateHeading('No roles found')
            ->emptyStateDescription('Create roles to organize permissions.');
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListRoles::route('/'),
            'create' => Pages\CreateRole::route('/create'),
            'edit' => Pages\EditRole::route('/{record}/edit'),
        ];
    }

    public static function canDelete(Model $record): bool
    {
        // Prevent deletion of critical roles
        return !in_array($record->name, ['Super Admin', 'Admin']);
    }
}
```

- [ ] **Step 2: Create ListRoles page**

Create: `DAD-System/app/Filament/Resources/RoleResource/Pages/ListRoles.php`

```php
<?php

namespace App\Filament\Resources\RoleResource\Pages;

use App\Filament\Resources\RoleResource;
use Filament\Resources\Pages\ListRecords;

class ListRoles extends ListRecords
{
    protected static string $resource = RoleResource::class;

    protected function getHeaderActions(): array
    {
        return [
            //
        ];
    }
}
```

- [ ] **Step 3: Create CreateRole page**

Create: `DAD-System/app/Filament/Resources/RoleResource/Pages/CreateRole.php`

```php
<?php

namespace App\Filament\Resources\RoleResource\Pages;

use App\Filament\Resources\RoleResource;
use Filament\Resources\Pages\CreateRecord;

class CreateRole extends CreateRecord
{
    protected static string $resource = RoleResource::class;
}
```

- [ ] **Step 4: Create EditRole page**

Create: `DAD-System/app/Filament/Resources/RoleResource/Pages/EditRole.php`

```php
<?php

namespace App\Filament\Resources\RoleResource\Pages;

use App\Filament\Resources\RoleResource;
use Filament\Resources\Pages\EditRecord;

class EditRole extends EditRecord
{
    protected static string $resource = RoleResource::class;
}
```

- [ ] **Step 5: Commit**

```bash
git add DAD-System/app/Filament/Resources/RoleResource
git commit -m "feat: create RoleResource with permission management"
```

---

## Task 4: Create PermissionResource for Viewing and Managing Permissions

**Files:**
- Create: `DAD-System/app/Filament/Resources/PermissionResource.php`
- Create: `DAD-System/app/Filament/Resources/PermissionResource/Pages/ListPermissions.php`
- Create: `DAD-System/app/Filament/Resources/PermissionResource/Pages/CreatePermission.php`
- Create: `DAD-System/app/Filament/Resources/PermissionResource/Pages/EditPermission.php`

- [ ] **Step 1: Create PermissionResource**

Create: `DAD-System/app/Filament/Resources/PermissionResource.php`

```php
<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PermissionResource\Pages;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Permission;

class PermissionResource extends Resource
{
    protected static ?string $model = Permission::class;

    protected static ?string $navigationIcon = 'heroicon-o-key';

    protected static ?int $navigationSort = 3;

    protected static ?string $navigationGroup = 'Administration';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Permission Information')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255)
                            ->helperText('Use dot notation: resource.action (e.g., users.view, users.create)'),
                        Forms\Components\TextInput::make('guard_name')
                            ->default('web')
                            ->required()
                            ->maxLength(255),
                    ])
                    ->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->badge()
                    ->color('success')
                    ->formatStateUsing(fn ($state) => str($state)->replace('.', ' → ')->title()),
                Tables\Columns\TextColumn::make('guard_name')
                    ->searchable()
                    ->sortable()
                    ->badge()
                    ->color('gray'),
                Tables\Columns\TextColumn::make('roles.name')
                    ->badge()
                    ->color('warning')
                    ->separator(', ')
                    ->limitList(2)
                    ->expandableLimitList(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('roles')
                    ->relationship('roles', 'name')
                    ->label('Filter by Roles'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->emptyStateHeading('No permissions found')
            ->emptyStateDescription('Create permissions to control access.')
            ->defaultSort('name', 'asc');
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPermissions::route('/'),
            'create' => Pages\CreatePermission::route('/create'),
            'edit' => Pages\EditPermission::route('/{record}/edit'),
        ];
    }
}
```

- [ ] **Step 2: Create ListPermissions page**

Create: `DAD-System/app/Filament/Resources/PermissionResource/Pages/ListPermissions.php`

```php
<?php

namespace App\Filament\Resources\PermissionResource\Pages;

use App\Filament\Resources\PermissionResource;
use Filament\Resources\Pages\ListRecords;

class ListPermissions extends ListRecords
{
    protected static string $resource = PermissionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            //
        ];
    }
}
```

- [ ] **Step 3: Create CreatePermission page**

Create: `DAD-System/app/Filament/Resources/PermissionResource/Pages/CreatePermission.php`

```php
<?php

namespace App\Filament\Resources\PermissionResource\Pages;

use App\Filament\Resources\PermissionResource;
use Filament\Resources\Pages\CreateRecord;

class CreatePermission extends CreateRecord
{
    protected static string $resource = PermissionResource::class;
}
```

- [ ] **Step 4: Create EditPermission page**

Create: `DAD-System/app/Filament/Resources/PermissionResource/Pages/EditPermission.php`

```php
<?php

namespace App\Filament\Resources\PermissionResource\Pages;

use App\Filament\Resources\PermissionResource;
use Filament\Resources\Pages\EditRecord;

class EditPermission extends EditRecord
{
    protected static string $resource = PermissionResource::class;
}
```

- [ ] **Step 5: Commit**

```bash
git add DAD-System/app/Filament/Resources/PermissionResource
git commit -m "feat: create PermissionResource for viewing and managing permissions"
```

---

## Task 5: Seed Initial Roles and Permissions

**Files:**
- Create: `DAD-System/database/seeders/RolePermissionSeeder.php`

- [ ] **Step 1: Create RolePermissionSeeder**

Create: `DAD-System/database/seeders/RolePermissionSeeder.php`

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing roles and permissions
        Permission::query()->delete();
        Role::query()->delete();

        // Create permissions grouped by resource
        $resources = ['users', 'roles', 'permissions', 'data_sources', 'mapping_templates', 'analysis_templates', 'data_outputs'];
        $actions = ['view any', 'view', 'create', 'update', 'delete', 'restore', 'force delete'];

        $permissions = [];
        foreach ($resources as $resource) {
            foreach ($actions as $action) {
                $permissions[] = "{$resource}.{$action}";
            }
        }

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        // Create roles
        $superAdmin = Role::firstOrCreate([
            'name' => 'Super Admin',
            'guard_name' => 'web',
        ]);

        $admin = Role::firstOrCreate([
            'name' => 'Admin',
            'guard_name' => 'web',
        ]);

        $editor = Role::firstOrCreate([
            'name' => 'Editor',
            'guard_name' => 'web',
        ]);

        $viewer = Role::firstOrCreate([
            'name' => 'Viewer',
            'guard_name' => 'web',
        ]);

        // Assign all permissions to Super Admin
        $superAdmin->givePermissionTo(Permission::all());

        // Assign permissions to Admin (no delete users)
        $admin->givePermissionTo(
            Permission::where('name', 'not like', '%users.delete%')
                ->where('name', 'not like', '%users.force delete%')
                ->get()
        );

        // Assign permissions to Editor (view and create only)
        $editor->givePermissionTo(
            Permission::where('name', 'like', '%view%')
                ->orWhere('name', 'like', '%create%')
                ->get()
        );

        // Assign view permissions to Viewer
        $viewer->givePermissionTo(
            Permission::where('name', 'like', '%view%')
                ->get()
        );

        $this->command->info('✓ Roles and permissions seeded successfully');
        $this->command->info('  - Super Admin: All permissions');
        $this->command->info('  - Admin: Most permissions (no user deletion)');
        $this->command->info('  - Editor: View and create permissions');
        $this->command->info('  - Viewer: View only permissions');
    }
}
```

- [ ] **Step 2: Add seeder to DatabaseSeeder**

Open: `DAD-System/database/seeders/DatabaseSeeder.php`

Update to:
```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
        ]);
    }
}
```

- [ ] **Step 3: Run the seeder**

```bash
cd DAD-System
php artisan db:seed --class=RolePermissionSeeder
```

Expected output:
```
✓ Roles and permissions seeded successfully
  - Super Admin: All permissions
  - Admin: Most permissions (no user deletion)
  - Editor: View and create permissions
  - Viewer: View only permissions
```

- [ ] **Step 4: Verify roles and permissions in database**

```bash
php artisan tinker --execute="echo 'Roles: ' . \Spatie\Permission\Models\Role::count() . PHP_EOL; echo 'Permissions: ' . \Spatie\Permission\Models\Permission::count() . PHP_EOL;"
```

Expected: Roles: 4, Permissions: 56 (8 resources × 7 actions)

- [ ] **Step 5: Commit**

```bash
git add DAD-System/database/seeders/
git commit -m "feat: seed initial roles and permissions with predefined access levels"
```

---

## Task 6: Create Super Admin User

**Files:**
- Modify: `DAD-System/database/seeders/RolePermissionSeeder.php`

- [ ] **Step 1: Update RolePermissionSeeder to create super admin user**

Open: `DAD-System/database/seeders/RolePermissionSeeder.php`

Add this at the end of the `run()` method, before the info messages:

```php
        // Create default super admin user
        $superAdminUser = \App\Models\User::firstOrCreate(
            ['email' => 'admin@dad-system.local'],
            [
                'name' => 'Super Admin',
                'password' => bcrypt('admin123'),
            ]
        );

        $superAdminUser->assignRole('Super Admin');
```

- [ ] **Step 2: Re-run the seeder**

```bash
cd DAD-System
php artisan db:seed --class=RolePermissionSeeder
```

Expected: "✓ Roles and permissions seeded successfully" with user creation

- [ ] **Step 3: Verify super admin user was created**

```bash
php artisan tinker --execute="$user = \App\Models\User::where('email', 'admin@dad-system.local')->first(); echo 'User: ' . $user->name . ' | Role: ' . $user->roles->first()->name . PHP_EOL;"
```

Expected: User: Super Admin | Role: Super Admin

- [ ] **Step 4: Commit**

```bash
git add DAD-System/database/seeders/RolePermissionSeeder.php
git commit -m "feat: create default super admin user (admin@dad-system.local / admin123)"
```

---

## Task 7: Test Complete CRUD Operations

**Files:**
- None (testing only)

- [ ] **Step 1: Start development server**

```bash
cd DAD-System
php artisan serve
```

Expected: Server running on http://127.0.0.1:8000

- [ ] **Step 2: Navigate to admin panel**

Open browser: http://127.0.0.1:8000/admin

- [ ] **Step 3: Login with super admin credentials**

- Email: `admin@dad-system.local`
- Password: `admin123`

Expected: Successfully logged in to admin panel

- [ ] **Step 4: Test User CRUD operations**

1. Navigate to Users resource
2. Click "Create User" button
3. Fill form:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
   - Password Confirmation: password123
   - Roles: Select "Viewer"
4. Click "Create"
5. Verify user appears in list
6. Click edit on the user
7. Change role to "Editor"
8. Click "Save"
9. Verify role updated
10. Click delete on the user
11. Confirm deletion

Expected: All CRUD operations successful

- [ ] **Step 5: Test Role CRUD operations**

1. Navigate to Roles resource
2. Click "Create Role" button
3. Fill form:
   - Name: Test Role
   - Guard Name: web
   - Permissions: Select 2-3 permissions
4. Click "Create"
5. Verify role appears in list with permissions
6. Click edit on the role
7. Add more permissions
8. Click "Save"
9. Verify permissions updated
10. Click delete on the role
11. Confirm deletion

Expected: All CRUD operations successful

- [ ] **Step 6: Test Permission CRUD operations**

1. Navigate to Permissions resource
2. Click "Create Permission" button
3. Fill form:
   - Name: test.resource.view any
   - Guard Name: web
4. Click "Create"
5. Verify permission appears in list
6. Verify permissions are grouped nicely with dot notation
7. Click edit on the permission
8. Change name to test.resource.edit
9. Click "Save"
10. Click delete on the permission
11. Confirm deletion

Expected: All CRUD operations successful

- [ ] **Step 7: Verify role assignment flow**

1. Create a new user
2. Assign "Editor" role
3. Create a new role "Manager"
4. Assign "users.view any" and "data_sources.create" permissions
5. Edit the user created in step 1
6. Add "Manager" role (user should now have both Editor and Manager roles)

Expected: Multiple roles can be assigned to a single user

- [ ] **Step 8: Stop development server**

Press Ctrl+C in the terminal where artisan serve is running

Expected: Server stopped

---

## Task 8: Configure Filament Panel Permissions

**Files:**
- Modify: `DAD-System/app/Providers/Filament/AdminPanelProvider.php`

- [ ] **Step 1: Update AdminPanelProvider to use Spatie permissions**

Open: `DAD-System/app/Providers/Filament/AdminPanelProvider.php`

Replace entire file with:
```php
<?php

namespace App\Providers\Filament;

use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages\Dashboard;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Widgets\AccountWidget;
use Filament\Widgets\FilamentInfoWidget;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;
use Spatie\Permission\Middleware\PermissionMiddleware;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->darkMode(false)
            ->id('admin')
            ->path('admin')
            ->login()
            ->colors([
                'primary' => Color::Amber,
            ])
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\Filament\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\Filament\Pages')
            ->pages([
                Dashboard::class,
            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\Filament\Widgets')
            ->widgets([
                AccountWidget::class,
                FilamentInfoWidget::class,
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                PreventRequestsDuringMaintenance::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ]);
    }
}
```

- [ ] **Step 2: Test that panel still loads**

```bash
php artisan config:clear
php artisan serve
```

Navigate to: http://127.0.0.1:8000/admin

Expected: Login page loads successfully

- [ ] **Step 3: Commit**

```bash
git add DAD-System/app/Providers/Filament/AdminPanelProvider.php
git commit -m "feat: configure Filament panel with proper middleware"
```

---

## Task 9: Add Resource-Level Permission Policies

**Files:**
- Create: `DAD-System/app/Policies/UserPolicy.php`
- Create: `DAD-System/app/Policies/RolePolicy.php`
- Create: `DAD-System/app/Policies/PermissionPolicy.php`

- [ ] **Step 1: Create UserPolicy**

Create: `DAD-System/app/Policies/UserPolicy.php`

```php
<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->can('users.view any');
    }

    public function view(User $user, User $model): bool
    {
        return $user->can('users.view');
    }

    public function create(User $user): bool
    {
        return $user->can('users.create');
    }

    public function update(User $user, User $model): bool
    {
        return $user->can('users.update');
    }

    public function delete(User $user, User $model): bool
    {
        return $user->can('users.delete');
    }

    public function restore(User $user, User $model): bool
    {
        return $user->can('users.restore');
    }

    public function forceDelete(User $user, User $model): bool
    {
        return $user->can('users.force delete');
    }
}
```

- [ ] **Step 2: Create RolePolicy**

Create: `DAD-System/app/Policies/RolePolicy.php`

```php
<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Spatie\Permission\Models\Role;

class RolePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->can('roles.view any');
    }

    public function view(User $user, Role $model): bool
    {
        return $user->can('roles.view');
    }

    public function create(User $user): bool
    {
        return $user->can('roles.create');
    }

    public function update(User $user, Role $model): bool
    {
        return $user->can('roles.update');
    }

    public function delete(User $user, Role $model): bool
    {
        return $user->can('roles.delete');
    }

    public function restore(User $user, Role $model): bool
    {
        return $user->can('roles.restore');
    }

    public function forceDelete(User $user, Role $model): bool
    {
        return $user->can('roles.force delete');
    }
}
```

- [ ] **Step 3: Create PermissionPolicy**

Create: `DAD-System/app/Policies/PermissionPolicy.php`

```php
<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Spatie\Permission\Models\Permission;

class PermissionPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->can('permissions.view any');
    }

    public function view(User $user, Permission $model): bool
    {
        return $user->can('permissions.view');
    }

    public function create(User $user): bool
    {
        return $user->can('permissions.create');
    }

    public function update(User $user, Permission $model): bool
    {
        return $user->can('permissions.update');
    }

    public function delete(User $user, Permission $model): bool
    {
        return $user->can('permissions.delete');
    }

    public function restore(User $user, Permission $model): bool
    {
        return $user->can('permissions.restore');
    }

    public function forceDelete(User $user, Permission $model): bool
    {
        return $user->can('permissions.force delete');
    }
}
```

- [ ] **Step 4: Register policies in AuthServiceProvider**

Open: `DAD-System/app/Providers/AuthServiceProvider.php`

Update the `$policies` property:
```php
protected $policies = [
    User::class => UserPolicy::class,
    Role::class => RolePolicy::class,
    Permission::class => PermissionPolicy::class,
];
```

- [ ] **Step 5: Commit**

```bash
git add DAD-System/app/Policies/ DAD-System/app/Providers/AuthServiceProvider.php
git commit -m "feat: add resource-level permission policies"
```

---

## Task 10: Final Integration Test

**Files:**
- None (testing only)

- [ ] **Step 1: Clear all caches**

```bash
cd DAD-System
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

Expected: All caches cleared

- [ ] **Step 2: Start fresh development server**

```bash
php artisan serve
```

Expected: Server running

- [ ] **Step 3: Complete end-to-end test workflow**

1. Login as super admin (admin@dad-system.local / admin123)
2. Create new user "John Doe" (john@example.com / password123)
3. Assign "Editor" role
4. Logout as super admin
5. Login as John Doe
6. Verify John can view but not delete users
7. Logout as John Doe
8. Login as super admin
9. Create new role "Manager" with specific permissions
10. Assign "Manager" role to John
11. Login as John Doe again
12. Verify new permissions work
13. Test all CRUD operations on Users, Roles, and Permissions

Expected: All permission checks work correctly

- [ ] **Step 4: Stop server and push to branch**

```bash
git push -u origin project_const
```

Expected: Branch pushed successfully

---

## Summary

After completing all tasks, you will have:
- ✅ Spatie Laravel Permission package integrated
- ✅ Complete Filament admin interface for Users, Roles, and Permissions
- ✅ Pre-seeded roles: Super Admin, Admin, Editor, Viewer
- ✅ Default super admin user for initial access
- ✅ Resource-level permission policies
- ✅ Full CRUD operations for all three entities
- ✅ Role-permission and user-role many-to-many relationships
- ✅ Permission-based access control throughout the system

**Default Credentials:**
- Email: `admin@dad-system.local`
- Password: `admin123`
- Role: Super Admin
