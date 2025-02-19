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
const BaseExtensionCtrl_1 = require("./BaseExtensionCtrl");
const ExtModelFetcher_1 = require("../api/ExtModelFetcher");
const CoreLib_1 = require("../lib/CoreLib");
var ResourceType;
(function (ResourceType) {
})(ResourceType || (ResourceType = {}));
/**
 * @openapi
 * components:
 *   schemas:
 *     Vendor:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           description: An identification code for the vendor.
 *         name:
 *           type: string
 *           description: The name of the vendor.
 *       required:
 *         - code
 *         - name
 *     LTILink:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: The human readable title/label for the activity being addressed by the content available through the LTI link.
 *         vendor:
 *           $ref: '#/components/schemas/Vendor'
 *         launch_url:
 *           type: string
 *           format: uri
 *           description: The URL for the LTI launch.
 *         secure_launch_url:
 *           type: string
 *           format: uri
 *           description: A secure URL for the LTI launch.
 *       required:
 *         - title
 *         - vendor
 *         - launch_url
 *         - secure_launch_url
 *     Resource:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The name/title of the resource.
 *         description:
 *           type: string
 *           description: A human readable description of the contents of the resource.
 *         subject:
 *           type: array
 *           items:
 *             type: string
 *           description: The subject(s) of the resource. May have multiple subjects tagged.
 *         url:
 *           type: string
 *           format: uri
 *           description: How to access the resource over the Internet e.g. HTTP, FTP, etc.
 *         ltiLink:
 *           $ref: '#/components/schemas/LTILink'
 *         learningResourceType:
 *           type: array
 *           items:
 *             type: string
 *           description: The type of the resource. There may be multiple types.
 *         publisher:
 *           type: string
 *           description: Owner of the rights to the resource or who made it available (company or person).
 *       required:
 *         - name
 *         - learningResourceType
 *         - publisher
 *     LTICredentials:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: The display name of the tool.
 *         secure_launch_url:
 *           type: string
 *           format: uri
 *           description: The secure URL for launching the tool.
 *         launch_url:
 *           type: string
 *           format: uri
 *           description: The URL for launching the tool.
 *         oauth_consumer_key:
 *           type: string
 *           description: The OAuth consumer key for the tool.
 *         oauth_shared_secret:
 *           type: string
 *           description: The OAuth shared secret for the tool.
 *       required:
 *         - title
 *         - secure_launch_url
 *         - launch_url
 *         - oauth_consumer_key
 *         - oauth_shared_secret
 */
class ResourceController extends BaseExtensionCtrl_1.BaseExtensionCtrl {
    constructor() {
        super(...arguments);
        /**
         * @openapi
         * /core/resources:
         *   get:
         *     operationId: searchForResources
         *     summary: The REST read request message for the searchForResources() API call. Inspired by resource search
         *     tags:
         *       - pblc
         *     description: The response code for when the query request has been successfully completed and the set of identified resources returned. This would be accompanied by the 'codeMajor/severity' values of 'success/status'.
         *     responses:
        *       200:
        *         description: Successfully created learning object
        *         content:
        *          application/json:
        *           schema:
        *              $ref: '#/components/schemas/Resource'
         */
        this.getResources = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const DEPOY_URL = process.env.DEPLOY_URL;
                const [los, tools, relations, services] = yield Promise.all([
                    ExtModelFetcher_1.extModelFetchInstance.findAll('learningObjects/mgmt'),
                    ExtModelFetcher_1.extModelFetchInstance.findAll('tools/mgmt/tools'),
                    CoreLib_1.relationBDTOInstance.findAll(),
                    ExtModelFetcher_1.extModelFetchInstance.findAll('services/mgmt/services'),
                ]);
                let resources = [];
                let losHaveTools = relations.filter(((relation) => relation.fromType === 'lo' && relation.toType === 'tool'));
                for (const loHasTool of losHaveTools) {
                    let [tool, lo, service] = [tools.find((tool) => tool._id === loHasTool.toId), los.find((lo) => lo._id === lo.fromId),
                        services.find((service) => {
                            return relations.find((relation) => relation.fromId === service._id && relation.toId === loHasTool.toId);
                        })
                    ];
                    resources.push({
                        name: tool.displayName,
                        learningResourceType: ['lti11'],
                        publisher: service.displayName,
                        url: `${DEPOY_URL}/core/resources/access_control?ids=${tool._id}`,
                        ltiLink: {
                            title: tool.displayName,
                            vendor: {
                                name: service.displayName,
                                code: `${DEPOY_URL}/services/mgmt/${service._id}`
                            },
                            launch_url: `${DEPOY_URL}/launch/${tool._id}`,
                            secure_launch_url: `${DEPOY_URL}/launch/${tool._id}`
                        }
                    });
                }
                return res.json(resources);
            }
            catch (err) {
                return next(err);
            }
        });
        /**
        * @openapi
        * /core/resources/access_control:
        *   get:
        *     operationId: getToolCredentials
        *     parameters:
        *          - name: ids
        *            in: query
        *            description: Comma sepearted string of resource ids
        *     summary: The REST read request message for the searchForResources() API call.
        *     tags:
        *       - pblc
        *     description: This is the search request. The criteria for the search are passed as query parameters and the set of identified resources are returned in the payload for the response message.
        *     responses:
        *       200:
        *         description: Successfully created learning object
        *         content:
        *          application/json:
        *           schema:
        *              type: array
        *              items:
        *                  $ref: '#/components/schemas/LTICredentials'
        *
        */
        this.getToolCredentialsForResource = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const ids = ((_a = req.query.ids) === null || _a === void 0 ? void 0 : _a.split(',')) || [];
                const [tools] = yield Promise.all([
                    ExtModelFetcher_1.extModelFetchInstance.findAll('tools/mgmt/tools').then((tools) => {
                        return tools.filter((tool) => ids.includes(tool._id));
                    }),
                ]);
                return res.json(tools.map((tool) => ({
                    title: tool.displayName,
                    secure_launch_url: tool.launchableUrl,
                    launch_url: tool.launchableUrl,
                    oauth_consumer_key: tool.username,
                    oauth_shared_secret: tool.password
                })));
            }
            catch (err) {
                return next(err);
            }
        });
    }
}
let controller = new ResourceController();
controller.router.get('/', controller.getResources);
controller.router.get('/access_control', controller.getToolCredentialsForResource);
exports.default = controller;
