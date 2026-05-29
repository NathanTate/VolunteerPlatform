using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using VolunteerPlatform.Domain.Entities;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Infrastructure.Persistence;

/// <summary>
/// Seeds a realistic set of Ukrainian volunteer-platform data for demos / development.
/// Call <see cref="SeedAsync"/> after EF migrations are applied.
/// </summary>
public static class DbSeeder
{
    // ── deterministic user IDs so re-seeding is idempotent ───────────────────
    private const string OrgAdmin1UserId  = "ORG-ADMIN-00000000000000000001";
    private const string OrgAdmin2UserId  = "ORG-ADMIN-00000000000000000002";
    private const string Coordinator1UserId = "COORDINATOR-000000000000000001";
    private const string Coordinator2UserId = "COORDINATOR-000000000000000002";

    public static async Task SeedAsync(IServiceProvider services)
    {
        var logger = services.GetRequiredService<ILogger<ApplicationDbContext>>();
        var db     = services.GetRequiredService<ApplicationDbContext>();
        var userMgr = services.GetRequiredService<UserManager<User>>();
        var roleMgr  = services.GetRequiredService<RoleManager<IdentityRole>>();

        // ── 0. Migrate ────────────────────────────────────────────────────────
        await db.Database.MigrateAsync();

        // ── 1. Roles ──────────────────────────────────────────────────────────
        string[] roleNames = ["Guest", "Volunteer", "Coordinator", "OrganizationAdmin", "SuperAdmin"];
        foreach (var role in roleNames)
            if (!await roleMgr.RoleExistsAsync(role))
                await roleMgr.CreateAsync(new IdentityRole(role));

        // ── 2. Users ──────────────────────────────────────────────────────────
        var superAdmin = await EnsureUser(userMgr,
            id: "SUPER-ADMIN-000000000000000000001",
            email: "admin@volunteer.ua",
            firstName: "Адміністратор",
            lastName: "Системи",
            role: UserRole.SuperAdmin,
            identityRole: "SuperAdmin",
            confirmed: true);

        var orgAdmin1 = await EnsureUser(userMgr,
            id: OrgAdmin1UserId,
            email: "org1@volunteer.ua",
            firstName: "Марія",
            lastName: "Коваленко",
            role: UserRole.OrganizationAdmin,
            identityRole: "OrganizationAdmin",
            confirmed: true,
            organizationName: "Допомога Разом");

        var orgAdmin2 = await EnsureUser(userMgr,
            id: OrgAdmin2UserId,
            email: "org2@volunteer.ua",
            firstName: "Олексій",
            lastName: "Бойченко",
            role: UserRole.OrganizationAdmin,
            identityRole: "OrganizationAdmin",
            confirmed: true,
            organizationName: "Захисники України");

        var coord1 = await EnsureUser(userMgr,
            id: Coordinator1UserId,
            email: "coord1@volunteer.ua",
            firstName: "Наталія",
            lastName: "Шевченко",
            role: UserRole.Coordinator,
            identityRole: "Coordinator",
            confirmed: true);

        var coord2 = await EnsureUser(userMgr,
            id: Coordinator2UserId,
            email: "coord2@volunteer.ua",
            firstName: "Дмитро",
            lastName: "Мельник",
            role: UserRole.Coordinator,
            identityRole: "Coordinator",
            confirmed: true);

        // Volunteers
        var volunteers = new List<User>();
        var volData = new (string Email, string First, string Last)[]
        {
            ("vol1@volunteer.ua",  "Іван",     "Петренко"),
            ("vol2@volunteer.ua",  "Оксана",   "Лисенко"),
            ("vol3@volunteer.ua",  "Тарас",    "Гриценко"),
            ("vol4@volunteer.ua",  "Ірина",    "Мороз"),
            ("vol5@volunteer.ua",  "Андрій",   "Кравченко"),
            ("vol6@volunteer.ua",  "Юлія",     "Сидоренко"),
            ("vol7@volunteer.ua",  "Михайло",  "Бондаренко"),
            ("vol8@volunteer.ua",  "Вікторія", "Харченко"),
        };
        for (int i = 0; i < volData.Length; i++)
        {
            var (email, first, last) = volData[i];
            var v = await EnsureUser(userMgr,
                id: $"VOLUNTEER-0000000000000000{i + 1:D5}",
                email: email,
                firstName: first,
                lastName: last,
                role: UserRole.Volunteer,
                identityRole: "Volunteer",
                confirmed: true);
            volunteers.Add(v);
        }

        // ── 3. Initiatives ────────────────────────────────────────────────────
        if (await db.Initiatives.AnyAsync()) { logger.LogInformation("Seed: data already present, skipping."); return; }

        var now = DateTime.UtcNow;

        var initiatives = new List<Initiative>
        {
            // ── Kyiv
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Прибирання парку Голосіїво",
                Description = "Прибираємо центральну алею та береги озера після зимового сезону. Потрібні волонтери з лопатами та рукавицями.",
                Category = InitiativeCategory.Environmental,
                UrgencyLevel = UrgencyLevel.Medium,
                Status = InitiativeStatus.Active,
                StartDate = now.AddDays(-5),
                EndDate = now.AddDays(25),
                Latitude = 50.3869, Longitude = 30.4700,
                Address = "Парк Голосіїво, Київ",
                RadiusKm = 3,
                RequiredVolunteers = 20,
                MaxParticipants = 30,
                IsEmergency = false,
                OrganizerId = orgAdmin1.Id,
                CreatedAt = now.AddDays(-10)
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Допомога вимушеним переселенцям",
                Description = "Розподіл гуманітарної допомоги: продукти харчування, засоби гігієни, одяг. Реєстрація обов'язкова.",
                Category = InitiativeCategory.Social,
                UrgencyLevel = UrgencyLevel.High,
                Status = InitiativeStatus.Active,
                StartDate = now.AddDays(-2),
                EndDate = now.AddDays(30),
                Latitude = 50.4501, Longitude = 30.5234,
                Address = "вул. Хрещатик, 22, Київ",
                RadiusKm = 10,
                RequiredVolunteers = 50,
                MaxParticipants = 80,
                IsEmergency = false,
                OrganizerId = orgAdmin1.Id,
                CreatedAt = now.AddDays(-7)
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Медична допомога пораненим",
                Description = "Термінова потреба у кваліфікованих медиках і санітарах для роботи у мобільному шпиталі.",
                Category = InitiativeCategory.Medical,
                UrgencyLevel = UrgencyLevel.Critical,
                Status = InitiativeStatus.Active,
                StartDate = now.AddDays(-1),
                EndDate = now.AddDays(14),
                Latitude = 50.4350, Longitude = 30.5180,
                Address = "вул. Велика Васильківська, 55, Київ",
                RadiusKm = 5,
                RequiredVolunteers = 15,
                MaxParticipants = 20,
                IsEmergency = true,
                OrganizerId = orgAdmin2.Id,
                CreatedAt = now.AddDays(-3)
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Навчання дітей переселенців",
                Description = "Волонтерські заняття з математики, мови та малювання для дітей 6-12 років у тимчасових пунктах розміщення.",
                Category = InitiativeCategory.Educational,
                UrgencyLevel = UrgencyLevel.Medium,
                Status = InitiativeStatus.Active,
                StartDate = now.AddDays(-14),
                EndDate = now.AddDays(60),
                Latitude = 50.4720, Longitude = 30.5050,
                Address = "просп. Перемоги, 37, Київ",
                RadiusKm = 2,
                RequiredVolunteers = 10,
                MaxParticipants = 15,
                IsEmergency = false,
                OrganizerId = orgAdmin1.Id,
                CreatedAt = now.AddDays(-20)
            },
            // ── Lviv
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Відновлення зруйнованих будівель, Львів",
                Description = "Допомога у відновленні пошкоджених будинків: кладка цегли, штукатурення, монтаж дахів.",
                Category = InitiativeCategory.Other,
                UrgencyLevel = UrgencyLevel.High,
                Status = InitiativeStatus.Active,
                StartDate = now.AddDays(-30),
                EndDate = now.AddDays(90),
                Latitude = 49.8397, Longitude = 24.0297,
                Address = "вул. Личаківська, 12, Львів",
                RadiusKm = 8,
                RequiredVolunteers = 40,
                MaxParticipants = 60,
                IsEmergency = false,
                OrganizerId = orgAdmin2.Id,
                CreatedAt = now.AddDays(-35)
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Збір крові у Львові",
                Description = "Кампанія з донорства крові. Всі групи. Реєстрація через сайт. Безкоштовне транспортування.",
                Category = InitiativeCategory.Medical,
                UrgencyLevel = UrgencyLevel.High,
                Status = InitiativeStatus.Planned,
                StartDate = now.AddDays(7),
                EndDate = now.AddDays(9),
                Latitude = 49.8425, Longitude = 24.0320,
                Address = "Обласна лікарня, Львів",
                RadiusKm = 30,
                RequiredVolunteers = 5,
                MaxParticipants = 200,
                IsEmergency = false,
                OrganizerId = orgAdmin2.Id,
                CreatedAt = now.AddDays(-5)
            },
            // ── Kharkiv
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Продуктові набори для пенсіонерів, Харків",
                Description = "Щотижнева доставка продуктових кошиків одиноким людям похилого віку у Шевченківському районі.",
                Category = InitiativeCategory.Social,
                UrgencyLevel = UrgencyLevel.Medium,
                Status = InitiativeStatus.Active,
                StartDate = now.AddDays(-60),
                EndDate = now.AddDays(120),
                Latitude = 49.9935, Longitude = 36.2304,
                Address = "Шевченківський район, Харків",
                RadiusKm = 7,
                RequiredVolunteers = 25,
                MaxParticipants = 35,
                IsEmergency = false,
                OrganizerId = orgAdmin1.Id,
                CreatedAt = now.AddDays(-65)
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Евакуація мирних жителів, Харків",
                Description = "УВАГА: Екстрена евакуація мешканців прифронтових районів. Потрібні водії та координатори.",
                Category = InitiativeCategory.Other,
                UrgencyLevel = UrgencyLevel.Critical,
                Status = InitiativeStatus.Active,
                StartDate = now.AddDays(-1),
                EndDate = now.AddDays(7),
                Latitude = 49.9851, Longitude = 36.2523,
                Address = "Холодногірський район, Харків",
                RadiusKm = 15,
                RequiredVolunteers = 30,
                MaxParticipants = 50,
                IsEmergency = true,
                OrganizerId = orgAdmin2.Id,
                CreatedAt = now.AddDays(-2)
            },
            // ── Odesa
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Посадка лісосмуг, Одеська область",
                Description = "Весняна акція озеленення: садимо дуби та акації вздовж трас. Забезпечуємо інструментами та перекусом.",
                Category = InitiativeCategory.Environmental,
                UrgencyLevel = UrgencyLevel.Low,
                Status = InitiativeStatus.Planned,
                StartDate = now.AddDays(14),
                EndDate = now.AddDays(15),
                Latitude = 46.4825, Longitude = 30.7233,
                Address = "Одеська обл., траса Київ–Одеса",
                RadiusKm = 20,
                RequiredVolunteers = 100,
                MaxParticipants = 150,
                IsEmergency = false,
                OrganizerId = orgAdmin1.Id,
                CreatedAt = now.AddDays(-3)
            },
            // ── Completed / archived for history
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Зимові набори для ЗСУ",
                Description = "Зібрано та передано 500 теплих комплектів для бійців на передовій. Акція завершена.",
                Category = InitiativeCategory.Other,
                UrgencyLevel = UrgencyLevel.Critical,
                Status = InitiativeStatus.Completed,
                StartDate = now.AddMonths(-3),
                EndDate = now.AddMonths(-1),
                Latitude = 50.4501, Longitude = 30.5234,
                Address = "Київ, різні точки збору",
                RadiusKm = 50,
                RequiredVolunteers = 200,
                MaxParticipants = 300,
                IsEmergency = false,
                OrganizerId = orgAdmin2.Id,
                CreatedAt = now.AddMonths(-4)
            },
        };

        await db.Initiatives.AddRangeAsync(initiatives);
        await db.SaveChangesAsync();
        logger.LogInformation("Seed: created {Count} initiatives", initiatives.Count);

        // ── 4. Application requests (confirmed volunteers) ────────────────────
        var activeInitiatives = initiatives
            .Where(i => i.Status == InitiativeStatus.Active)
            .ToList();

        var applications = new List<ApplicationRequest>();
        for (int v = 0; v < volunteers.Count; v++)
        {
            // Each volunteer applies to 2-3 active initiatives
            var targets = activeInitiatives.Skip(v % activeInitiatives.Count).Take(2).ToList();
            foreach (var init in targets)
            {
                applications.Add(new ApplicationRequest
                {
                    Id = Guid.NewGuid(),
                    InitiativeId = init.Id,
                    UserId = volunteers[v].Id,
                    Status = ApplicationStatus.Approved,
                    Comment = "Готовий допомогти!",
                    SubmittedAt = now.AddDays(-new Random(v).Next(1, 20))
                });
            }
        }
        await db.ApplicationRequests.AddRangeAsync(applications);
        await db.SaveChangesAsync();
        logger.LogInformation("Seed: created {Count} application requests", applications.Count);

        // ── 5. Volunteer tasks ────────────────────────────────────────────────
        var tasks = new List<VolunteerTask>();

        // Helper to add task
        void AddTask(Initiative initiative, string title, string desc,
            TaskPriority priority, VolunteerTaskStatus status,
            User createdBy, User? assignee = null, DateTime? deadline = null)
        {
            tasks.Add(new VolunteerTask
            {
                Id = Guid.NewGuid(),
                InitiativeId = initiative.Id,
                Title = title,
                Description = desc,
                Priority = priority,
                Status = status,
                CreatedById = createdBy.Id,
                AssignedVolunteerId = assignee?.Id,
                Deadline = deadline,
                CreatedAt = now.AddDays(-new Random(title.Length).Next(1, 15)),
                UpdatedAt = now.AddDays(-1)
            });
        }

        // Initiative 0 – Parк прибирання
        var park = initiatives[0];
        AddTask(park, "Зібрати мішки для сміття", "Підготувати та роздати 200 мішків волонтерам", TaskPriority.Medium, VolunteerTaskStatus.Completed, coord1, volunteers[0], now.AddDays(-2));
        AddTask(park, "Прибрати центральну алею", "Зібрати листя, гілки та побутове сміття", TaskPriority.High, VolunteerTaskStatus.Verified, coord1, volunteers[1], now.AddDays(-1));
        AddTask(park, "Очистити берег озера", "Видалити сміття та мул з берегової смуги", TaskPriority.High, VolunteerTaskStatus.InProgress, coord1, volunteers[2], now.AddDays(5));
        AddTask(park, "Посадка квітів", "Висадити 500 саджанців квітів вздовж алей", TaskPriority.Low, VolunteerTaskStatus.Pending, coord1, null, now.AddDays(10));

        // Initiative 1 – Допомога переселенцям
        var refugees = initiatives[1];
        AddTask(refugees, "Сортування гуманітарної допомоги", "Розсортувати одяг за розмірами та сезонністю", TaskPriority.High, VolunteerTaskStatus.InProgress, coord2, volunteers[3], now.AddDays(2));
        AddTask(refugees, "Реєстрація отримувачів допомоги", "Вести базу отримувачів та контролювати видачу", TaskPriority.Critical, VolunteerTaskStatus.Accepted, coord2, volunteers[4], now.AddDays(1));
        AddTask(refugees, "Завантаження/розвантаження вантажів", "Прийняти та розвантажити 3 вантажних автомобілі", TaskPriority.Medium, VolunteerTaskStatus.Pending, coord2, null, now.AddDays(3));
        AddTask(refugees, "Психологічна підтримка", "Провести групові заняття для дорослих переселенців", TaskPriority.High, VolunteerTaskStatus.Pending, coord2, null, now.AddDays(7));

        // Initiative 2 – Медична допомога (emergency)
        var medical = initiatives[2];
        AddTask(medical, "Транспортування медикаментів", "Термінова доставка перев'язок та антибіотиків", TaskPriority.Critical, VolunteerTaskStatus.InProgress, coord1, volunteers[5], now.AddDays(1));
        AddTask(medical, "Асистування хірургам", "Кваліфіковані помічники у польовій операційній", TaskPriority.Critical, VolunteerTaskStatus.Accepted, coord1, volunteers[6], now.AddDays(1));
        AddTask(medical, "Організація черги пацієнтів", "Реєстрація та сортування (тріаж) поранених", TaskPriority.High, VolunteerTaskStatus.InProgress, coord1, volunteers[7], now.AddDays(1));

        // Initiative 4 – Відновлення будівель Львів
        var construction = initiatives[4];
        AddTask(construction, "Розбір завалів", "Безпечний демонтаж пошкоджених конструкцій", TaskPriority.High, VolunteerTaskStatus.Completed, coord2, volunteers[0], now.AddDays(-5));
        AddTask(construction, "Кладка цегляних стін", "Відновлення зовнішніх стін секції А", TaskPriority.High, VolunteerTaskStatus.InProgress, coord2, volunteers[1], now.AddDays(14));
        AddTask(construction, "Монтаж дахового покриття", "Встановлення листів профнастилу на даху", TaskPriority.Medium, VolunteerTaskStatus.Pending, coord2, null, now.AddDays(21));
        AddTask(construction, "Встановлення вікон", "Монтаж металопластикових вікон (24 шт.)", TaskPriority.Medium, VolunteerTaskStatus.Pending, coord2, null, now.AddDays(30));

        // Initiative 6 – Продукти Харків
        var groceries = initiatives[6];
        AddTask(groceries, "Формування продуктових кошиків", "Скласти 80 наборів: крупи, олія, консерви", TaskPriority.High, VolunteerTaskStatus.Completed, coord1, volunteers[2], now.AddDays(-2));
        AddTask(groceries, "Доставка по адресах (район 1)", "Доставити 25 наборів у Шевченківський р-н", TaskPriority.Medium, VolunteerTaskStatus.Completed, coord1, volunteers[3], now.AddDays(-1));
        AddTask(groceries, "Доставка по адресах (район 2)", "Доставити 30 наборів у Київський р-н", TaskPriority.Medium, VolunteerTaskStatus.InProgress, coord1, volunteers[4], now.AddDays(1));
        AddTask(groceries, "Закупівля наступної партії", "Придбати продукти на наступний тиждень", TaskPriority.High, VolunteerTaskStatus.Pending, coord1, null, now.AddDays(5));

        // Initiative 7 – Евакуація Харків (emergency)
        var evacuation = initiatives[7];
        AddTask(evacuation, "Організувати автобусний конвой", "Залучити 5 автобусів та скласти маршрут", TaskPriority.Critical, VolunteerTaskStatus.InProgress, coord2, volunteers[5], now.AddDays(1));
        AddTask(evacuation, "Координація на виїзних пунктах", "Зустріти мешканців та супроводити до автобусів", TaskPriority.Critical, VolunteerTaskStatus.Accepted, coord2, volunteers[6], now.AddDays(1));
        AddTask(evacuation, "Реєстрація евакуйованих", "Вести списки осіб в реальному часі", TaskPriority.High, VolunteerTaskStatus.Pending, coord2, null, now.AddDays(2));

        await db.Tasks.AddRangeAsync(tasks);
        await db.SaveChangesAsync();
        logger.LogInformation("Seed: created {Count} tasks", tasks.Count);

        // ── 6. Notifications ──────────────────────────────────────────────────
        var notifications = new List<UserNotification>();

        // Broadcast: system welcome
        notifications.Add(new UserNotification
        {
            Id = Guid.NewGuid(),
            UserId = null,   // broadcast
            Title = "Ласкаво просимо до Volunteer Platform!",
            Message = "Платформа запущена. Долучайтесь до ініціатив та допомагайте разом.",
            Type = NotificationType.System,
            RelatedEntityId = null,
            RelatedEntityType = null,
            IsRead = false,
            CreatedAt = now.AddDays(-30)
        });

        // Per-volunteer notifications
        foreach (var vol in volunteers.Take(4))
        {
            notifications.Add(new UserNotification
            {
                Id = Guid.NewGuid(),
                UserId = vol.Id,
                Title = "Вашу заявку схвалено!",
                Message = "Вітаємо! Ваша заявка на участь в ініціативі підтверджена.",
                Type = NotificationType.ApplicationStatusChanged,
                RelatedEntityId = activeInitiatives.First().Id,
                RelatedEntityType = "Initiative",
                IsRead = false,
                CreatedAt = now.AddDays(-5)
            });
        }

        // Emergency broadcast
        notifications.Add(new UserNotification
        {
            Id = Guid.NewGuid(),
            UserId = null,
            Title = "🚨 ЕКСТРЕНИЙ СИГНАЛ: Евакуація, Харків",
            Message = "Ініціатива 'Евакуація мирних жителів' потребує негайної допомоги. Зверніться до координатора.",
            Type = NotificationType.Emergency,
            RelatedEntityId = initiatives[7].Id,
            RelatedEntityType = "Initiative",
            IsRead = false,
            CreatedAt = now.AddDays(-1)
        });

        await db.Notifications.AddRangeAsync(notifications);
        await db.SaveChangesAsync();
        logger.LogInformation("Seed: created {Count} notifications", notifications.Count);

        logger.LogInformation("Seed: completed successfully.");
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static async Task<User> EnsureUser(
        UserManager<User> userMgr,
        string id,
        string email,
        string firstName,
        string lastName,
        UserRole role,
        string identityRole,
        bool confirmed,
        string? organizationName = null)
    {
        var existing = await userMgr.FindByEmailAsync(email);
        if (existing != null) return existing;

        var user = new User
        {
            Id = id,
            UserName = email,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            Role = role,
            OrganizationName = organizationName,
            IsOrganizationApproved = organizationName != null,
            IsVolunteerConfirmed = confirmed,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow.AddDays(-60)
        };

        var result = await userMgr.CreateAsync(user, "Volunteer123!");
        if (!result.Succeeded)
            throw new InvalidOperationException(
                $"Seed: failed to create user {email}: {string.Join(", ", result.Errors.Select(e => e.Description))}");

        await userMgr.AddToRoleAsync(user, identityRole);
        return user;
    }
}
