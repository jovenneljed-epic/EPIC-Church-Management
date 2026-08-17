using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EPIC.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixFoundationsDiscipleshipSeed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "CourseModules",
                columns: new[] { "CourseModuleId", "CourseId", "Description", "IsPublished", "SortOrder", "Title" },
                values: new object[,]
                {
                    { 1, 1, "Understanding the basic foundations of Christian faith and discipleship.", true, 1, "Foundations of Faith" },
                    { 2, 1, "Discovering God's character, nature, and relationship with His people.", true, 2, "Knowing God" },
                    { 3, 1, "Understanding the person, ministry, death, resurrection, and lordship of Jesus Christ.", true, 3, "Knowing Jesus Christ" },
                    { 4, 1, "Learning about the Holy Spirit and His work in the life of every believer.", true, 4, "The Holy Spirit" },
                    { 5, 1, "Developing a strong relationship with Scripture and learning how to apply God's Word.", true, 5, "The Word of God" },
                    { 6, 1, "Developing a consistent prayer life and growing spiritually through fellowship with God.", true, 6, "Prayer and Spiritual Growth" },
                    { 7, 1, "Developing Christlike character, attitudes, values, and behavior.", true, 7, "Christian Character" },
                    { 8, 1, "Discovering the biblical calling to serve God, the church, and other people.", true, 8, "Serving Others" },
                    { 9, 1, "Learning how to communicate the Gospel and become a faithful witness for Christ.", true, 9, "Sharing Your Faith" },
                    { 10, 1, "Putting discipleship into practice and living a Christ-centered life every day.", true, 10, "Living as a Disciple" }
                });

            migrationBuilder.InsertData(
                table: "Lessons",
                columns: new[] { "LessonId", "Content", "CourseModuleId", "CreatedDate", "EstimatedMinutes", "IsFreePreview", "IsPublished", "ResourceUrl", "SortOrder", "Title", "UpdatedDate", "VideoUrl" },
                values: new object[,]
                {
                    { 1, "DESCRIPTION:\nUnderstanding the meaning and purpose of Christian discipleship.\n\nLESSON CONTENT:\nChristian discipleship is the lifelong process of following Jesus Christ, learning His teachings, becoming more like Him, and helping others follow Him.", 1, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, true, true, null, 1, "What Is Christian Discipleship?", null, null },
                    { 2, "DESCRIPTION:\nExploring what it means to surrender our lives to Christ.\n\nLESSON CONTENT:\nFollowing Jesus means placing Him at the center of our lives. It involves trusting Him, obeying His teachings, denying ourselves, and choosing His ways over our own desires.", 1, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 2, "What Does It Mean to Follow Jesus?", null, null },
                    { 3, "DESCRIPTION:\nUnderstanding salvation as God's gift through faith in Jesus Christ.\n\nLESSON CONTENT:\nSalvation is not earned through human achievement. God's grace provides forgiveness and new life through faith in Jesus Christ.", 1, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 3, "Salvation by Grace", null, null },
                    { 4, "DESCRIPTION:\nLearning how genuine faith affects our daily lives.\n\nLESSON CONTENT:\nBiblical faith involves trusting God even when circumstances are difficult or the future is uncertain.", 1, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 4, "Faith and Trust in God", null, null },
                    { 5, "DESCRIPTION:\nUnderstanding biblical repentance and transformation.\n\nLESSON CONTENT:\nRepentance involves turning away from sin and turning toward God. True repentance produces a changed direction and a desire to live according to God's will.", 1, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 5, "Repentance and New Life", null, null },
                    { 6, "DESCRIPTION:\nUnderstanding commitment, sacrifice, and obedience in following Christ.\n\nLESSON CONTENT:\nJesus called His followers to deny themselves, take up their cross, and follow Him. Discipleship requires commitment and surrender.", 1, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 6, "The Cost of Discipleship", null, null },
                    { 7, "DESCRIPTION:\nUnderstanding the biblical revelation of God.\n\nLESSON CONTENT:\nGod is the Creator, Sustainer, and Lord of all creation. Scripture reveals Him as holy, righteous, loving, faithful, and sovereign.", 2, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, true, true, null, 1, "Who Is God?", null, null },
                    { 8, "DESCRIPTION:\nExploring God's attributes and character.\n\nLESSON CONTENT:\nGod's character includes holiness, justice, mercy, love, faithfulness, wisdom, and goodness.", 2, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 2, "The Character of God", null, null },
                    { 9, "DESCRIPTION:\nDiscovering the depth of God's love for humanity.\n\nLESSON CONTENT:\nGod's love is demonstrated throughout Scripture and especially through Jesus Christ.", 2, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 3, "God's Love", null, null },
                    { 10, "DESCRIPTION:\nLearning to trust God's promises.\n\nLESSON CONTENT:\nGod remains faithful even when people are inconsistent. His promises provide believers with confidence and hope.", 2, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 4, "God's Faithfulness", null, null },
                    { 11, "DESCRIPTION:\nLearning to seek and follow God's will.\n\nLESSON CONTENT:\nChristians are called to seek God's will through Scripture, prayer, wisdom, and obedience.", 2, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 5, "God's Will", null, null },
                    { 12, "DESCRIPTION:\nUnderstanding worship as a lifestyle.\n\nLESSON CONTENT:\nWorship involves honoring God with our hearts, words, actions, relationships, work, and entire lives.", 2, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 6, "Worshiping God", null, null },
                    { 13, "DESCRIPTION:\nUnderstanding the identity and significance of Jesus Christ.\n\nLESSON CONTENT:\nJesus Christ is the central person of the Christian faith. The Gospels reveal Him as the Son of God, Savior, Teacher, Lord, and Messiah.", 3, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, true, true, null, 1, "Who Is Jesus?", null, null },
                    { 14, "DESCRIPTION:\nExploring the earthly ministry of Christ.\n\nLESSON CONTENT:\nJesus proclaimed God's kingdom, taught truth, healed the sick, showed compassion, and called people to follow Him.", 3, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 2, "The Ministry of Jesus", null, null },
                    { 15, "DESCRIPTION:\nLearning the central teachings of Christ.\n\nLESSON CONTENT:\nJesus taught His followers to love God, love others, forgive, serve, pray, remain faithful, and seek God's kingdom.", 3, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 3, "The Teachings of Jesus", null, null },
                    { 16, "DESCRIPTION:\nUnderstanding the significance of Jesus' death.\n\nLESSON CONTENT:\nThe cross stands at the center of the Gospel message. Jesus willingly gave Himself for humanity.", 3, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 4, "The Cross of Christ", null, null },
                    { 17, "DESCRIPTION:\nUnderstanding the importance of Christ's resurrection.\n\nLESSON CONTENT:\nThe resurrection of Jesus is foundational to Christian faith. Christ conquered death and demonstrated His victory.", 3, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 5, "The Resurrection", null, null },
                    { 18, "DESCRIPTION:\nUnderstanding the authority and lordship of Christ.\n\nLESSON CONTENT:\nCalling Jesus Lord means recognizing His authority over our lives and surrendering our decisions, priorities, relationships, and future to Him.", 3, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 6, "Jesus as Lord", null, null },
                    { 19, "DESCRIPTION:\nUnderstanding the person and identity of the Holy Spirit.\n\nLESSON CONTENT:\nThe Holy Spirit is the Spirit of God who works in believers and guides them into truth.", 4, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, true, true, null, 1, "Who Is the Holy Spirit?", null, null },
                    { 20, "DESCRIPTION:\nLearning how the Holy Spirit works in believers.\n\nLESSON CONTENT:\nThe Holy Spirit convicts, teaches, guides, strengthens, comforts, and transforms believers.", 4, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 2, "The Work of the Holy Spirit", null, null },
                    { 21, "DESCRIPTION:\nLearning how to live under the guidance of the Holy Spirit.\n\nLESSON CONTENT:\nWalking in the Spirit involves daily dependence upon God, obedience to His Word, and allowing the Spirit to shape our thoughts and actions.", 4, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 3, "Walking in the Spirit", null, null },
                    { 22, "DESCRIPTION:\nUnderstanding Christlike character produced by the Spirit.\n\nLESSON CONTENT:\nThe fruit of the Spirit describes qualities such as love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control.", 4, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 4, "The Fruit of the Spirit", null, null },
                    { 23, "DESCRIPTION:\nUnderstanding how God equips believers for ministry.\n\nLESSON CONTENT:\nGod gives spiritual gifts for strengthening the church and serving others.", 4, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 5, "Spiritual Gifts", null, null },
                    { 24, "DESCRIPTION:\nLearning about continual dependence upon the Holy Spirit.\n\nLESSON CONTENT:\nChristian life and ministry require continual dependence upon the Holy Spirit.", 4, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 6, "Being Filled With the Spirit", null, null },
                    { 25, "DESCRIPTION:\nUnderstanding the importance of Scripture.\n\nLESSON CONTENT:\nThe Bible reveals God's truth and provides guidance for faith and life.", 5, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, true, true, null, 1, "Why the Bible Matters", null, null },
                    { 26, "DESCRIPTION:\nDeveloping a consistent habit of Scripture reading.\n\nLESSON CONTENT:\nEffective Bible reading requires consistency, attention, prayer, and a willingness to understand and apply what God reveals.", 5, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 2, "Reading the Bible", null, null },
                    { 27, "DESCRIPTION:\nLearning how to study God's Word carefully.\n\nLESSON CONTENT:\nBible study involves observing the text, understanding its context, identifying its message, and applying its principles.", 5, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 3, "Studying Scripture", null, null },
                    { 28, "DESCRIPTION:\nLearning to reflect deeply on Scripture.\n\nLESSON CONTENT:\nBiblical meditation involves intentionally reflecting on God's Word and allowing its truth to shape our thoughts and actions.", 5, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 4, "Meditating on God's Word", null, null },
                    { 29, "DESCRIPTION:\nMoving from Bible knowledge to obedience.\n\nLESSON CONTENT:\nThe goal of Scripture is not merely information but transformation. Disciples should apply biblical truth to daily life.", 5, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 5, "Applying Scripture", null, null },
                    { 30, "DESCRIPTION:\nBuilding a life guided by Scripture.\n\nLESSON CONTENT:\nA disciple grows stronger by building life upon God's Word.", 5, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 6, "Living by the Word", null, null },
                    { 31, "DESCRIPTION:\nUnderstanding prayer as communication and fellowship with God.\n\nLESSON CONTENT:\nPrayer is an essential part of the believer's relationship with God. Through prayer we worship, confess, give thanks, ask for help, intercede, and seek guidance.", 6, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, true, true, null, 1, "What Is Prayer?", null, null },
                    { 32, "DESCRIPTION:\nLearning principles of prayer from Jesus' teaching.\n\nLESSON CONTENT:\nJesus provided a model for prayer that emphasizes God's holiness, God's kingdom, daily provision, forgiveness, and dependence upon Him.", 6, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 2, "The Lord's Prayer", null, null },
                    { 33, "DESCRIPTION:\nUnderstanding faith and confidence in prayer.\n\nLESSON CONTENT:\nFaith-filled prayer trusts God's character and wisdom while remaining surrendered to His will.", 6, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 3, "Praying With Faith", null, null },
                    { 34, "DESCRIPTION:\nLearning to pray for other people and situations.\n\nLESSON CONTENT:\nIntercession involves bringing the needs of others before God and is an important expression of Christian love.", 6, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 4, "Intercessory Prayer", null, null },
                    { 35, "DESCRIPTION:\nUnderstanding fasting as a spiritual discipline.\n\nLESSON CONTENT:\nFasting can help believers focus their attention on God, seek His direction, and deepen their dependence upon Him.", 6, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 5, "Fasting and Prayer", null, null },
                    { 36, "DESCRIPTION:\nCreating a sustainable lifestyle of prayer.\n\nLESSON CONTENT:\nA healthy prayer life grows through consistency and intentional times of fellowship with God.", 6, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 6, "Developing a Prayer Life", null, null },
                    { 37, "DESCRIPTION:\nUnderstanding spiritual transformation.\n\nLESSON CONTENT:\nChristian maturity involves becoming increasingly like Jesus in character, attitudes, relationships, and actions.", 7, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, true, true, null, 1, "Becoming Like Christ", null, null },
                    { 38, "DESCRIPTION:\nLearning the importance of humility in Christian life.\n\nLESSON CONTENT:\nHumility recognizes our dependence upon God and values others.", 7, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 2, "Humility", null, null },
                    { 39, "DESCRIPTION:\nDeveloping honesty and consistency.\n\nLESSON CONTENT:\nIntegrity means living consistently with biblical values even when nobody is watching.", 7, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 3, "Integrity", null, null },
                    { 40, "DESCRIPTION:\nLearning to forgive others as Christ forgives us.\n\nLESSON CONTENT:\nForgiveness releases resentment and reflects God's grace.", 7, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 4, "Forgiveness", null, null },
                    { 41, "DESCRIPTION:\nDeveloping Christlike love toward others.\n\nLESSON CONTENT:\nChristian love is demonstrated through action, care, compassion, dignity, and grace.", 7, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 5, "Love and Compassion", null, null },
                    { 42, "DESCRIPTION:\nLearning discipline and wise choices.\n\nLESSON CONTENT:\nSelf-control enables believers to manage desires, emotions, words, and actions in ways that honor God.", 7, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 6, "Self-Control", null, null },
                    { 43, "DESCRIPTION:\nUnderstanding the biblical calling to Christian service.\n\nLESSON CONTENT:\nJesus demonstrated servant leadership and called His followers to serve others.", 8, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, true, true, null, 1, "Called to Serve", null, null },
                    { 44, "DESCRIPTION:\nDiscovering opportunities for ministry within the church.\n\nLESSON CONTENT:\nEvery believer can contribute to the life and mission of the church through teaching, administration, worship, hospitality, discipleship, outreach, and practical care.", 8, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 2, "Serving in the Church", null, null },
                    { 45, "DESCRIPTION:\nUnderstanding leadership through service.\n\nLESSON CONTENT:\nBiblical leadership is about influence through example, humility, responsibility, and sacrificial care.", 8, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 3, "Servant Leadership", null, null },
                    { 46, "DESCRIPTION:\nDiscovering and using God-given abilities.\n\nLESSON CONTENT:\nBelievers should use their abilities and spiritual gifts to strengthen others and advance God's purposes.", 8, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 4, "Using Your Gifts", null, null },
                    { 47, "DESCRIPTION:\nLearning to serve faithfully and responsibly.\n\nLESSON CONTENT:\nChristian service should be carried out with diligence, humility, excellence, and faithfulness.", 8, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 5, "Serving With Excellence", null, null },
                    { 48, "DESCRIPTION:\nKeeping love at the center of Christian ministry.\n\nLESSON CONTENT:\nEffective Christian service combines faithfulness with genuine love and concern for people.", 8, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 6, "Serving With Love", null, null },
                    { 49, "DESCRIPTION:\nUnderstanding the central message of Christianity.\n\nLESSON CONTENT:\nThe Gospel is the good news of what God has done through Jesus Christ. It announces salvation, forgiveness, reconciliation, and new life through Christ.", 9, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, true, true, null, 1, "What Is the Gospel?", null, null },
                    { 50, "DESCRIPTION:\nLearning how to share your story of faith.\n\nLESSON CONTENT:\nA personal testimony explains how God has worked in your life and can help others understand the transforming power of Christ.", 9, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 2, "Your Personal Testimony", null, null },
                    { 51, "DESCRIPTION:\nLearning to communicate the Gospel simply and faithfully.\n\nLESSON CONTENT:\nEffective evangelism communicates God's truth clearly while treating people with respect, patience, compassion, and love.", 9, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 3, "Sharing the Gospel Clearly", null, null },
                    { 52, "DESCRIPTION:\nUnderstanding relational evangelism.\n\nLESSON CONTENT:\nGenuine care and friendship can create opportunities for meaningful conversations about faith.", 9, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 4, "Building Relationships", null, null },
                    { 53, "DESCRIPTION:\nLearning to respond to questions with wisdom and grace.\n\nLESSON CONTENT:\nChristians should be prepared to explain their hope while remaining humble and respectful.", 9, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 5, "Answering Questions About Faith", null, null },
                    { 54, "DESCRIPTION:\nUnderstanding the mission to make disciples.\n\nLESSON CONTENT:\nChristian mission goes beyond making converts. Jesus commanded His followers to make disciples who learn, obey, grow, and help others follow Him.", 9, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 6, "Making Disciples", null, null },
                    { 55, "DESCRIPTION:\nLearning to make Christ the center of everyday life.\n\nLESSON CONTENT:\nA Christ-centered life allows Jesus to shape priorities, relationships, decisions, goals, and values.", 10, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, true, true, null, 1, "A Christ-Centered Life", null, null },
                    { 56, "DESCRIPTION:\nApplying Christian faith to ordinary situations.\n\nLESSON CONTENT:\nWork, family, friendships, finances, responsibilities, and decisions can all become opportunities to demonstrate faithfulness to God.", 10, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 2, "Faith in Everyday Life", null, null },
                    { 57, "DESCRIPTION:\nLearning to remain faithful during difficult seasons.\n\nLESSON CONTENT:\nEvery believer experiences challenges, temptation, discouragement, and uncertainty. Spiritual strength grows through prayer, Scripture, fellowship, obedience, and dependence upon God.", 10, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 3, "Overcoming Spiritual Challenges", null, null },
                    { 58, "DESCRIPTION:\nUnderstanding the importance of Christian fellowship.\n\nLESSON CONTENT:\nBelievers were designed to grow together. Christian community provides encouragement, accountability, teaching, prayer, correction, and opportunities for service.", 10, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, false, true, null, 4, "Growing in Community", null, null },
                    { 59, "DESCRIPTION:\nLearning the importance of perseverance.\n\nLESSON CONTENT:\nChristian discipleship is a lifelong journey. Faithfulness requires perseverance, especially when circumstances are difficult.", 10, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 5, "Finishing Faithfully", null, null },
                    { 60, "DESCRIPTION:\nCreating a personal commitment to continue following Christ.\n\nLESSON CONTENT:\nDiscipleship is a lifelong commitment to Jesus Christ. A mature disciple continues learning, growing, serving, sharing the Gospel, and helping others become disciples.", 10, new DateTime(2026, 8, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, false, true, null, 6, "Your Discipleship Commitment", null, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 31);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 32);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 33);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 34);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 35);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 36);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 37);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 38);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 39);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 40);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 41);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 42);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 43);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 44);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 45);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 46);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 47);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 48);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 49);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 50);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 51);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 52);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 53);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 54);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 55);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 56);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 57);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 58);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 59);

            migrationBuilder.DeleteData(
                table: "Lessons",
                keyColumn: "LessonId",
                keyValue: 60);

            migrationBuilder.DeleteData(
                table: "CourseModules",
                keyColumn: "CourseModuleId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "CourseModules",
                keyColumn: "CourseModuleId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "CourseModules",
                keyColumn: "CourseModuleId",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "CourseModules",
                keyColumn: "CourseModuleId",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "CourseModules",
                keyColumn: "CourseModuleId",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "CourseModules",
                keyColumn: "CourseModuleId",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "CourseModules",
                keyColumn: "CourseModuleId",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "CourseModules",
                keyColumn: "CourseModuleId",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "CourseModules",
                keyColumn: "CourseModuleId",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "CourseModules",
                keyColumn: "CourseModuleId",
                keyValue: 10);
        }
    }
}
