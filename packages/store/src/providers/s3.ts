import { ObjectOptions, StoreProvider, StoreProviderConfig } from './base'
import { toBuffer, toStr } from '@notea/shared'
import { Client } from '@cinwell/awos-js'

export interface S3Config extends StoreProviderConfig {
  bucket: string
  accessKey: string
  secretKey: string
  type: 'oss' | 'aws'
  endPoint?: string
  pathStyle?: boolean
  region?: string
}

export class StoreS3 extends StoreProvider {
  store: Client
  config: S3Config

  constructor(config: S3Config) {
    super(config)
    this.store = new Client({
      type: config.type,
      ossOptions: {
        accessKeyId: config.accessKey,
        accessKeySecret: config.secretKey,
        endpoint: config.endPoint as string,
        bucket: config.bucket,
      },
      awsOptions: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
        endpoint: config.endPoint as string,
        bucket: config.bucket,
        s3ForcePathStyle: config.pathStyle,
        region: config.region,
      },
    })
    this.config = config
  }

  async getSignUrl(path: string) {
    return this.store.signatureUrl(this.path.getPath(path))
  }

  async hasObject(path: string) {
    try {
      const data = await this.store.head(this.path.getPath(path))

      return !!data
    } catch (e) {
      return false
    }
  }

  async getObject(path: string, isCompressed = false) {
    let content

    try {
      const result = await this.store.getAsBuffer(this.path.getPath(path))
      content = result?.content
    } catch (err) {
      if (err.code !== 'NoSuchKey') {
        throw err
      }
    }

    return toStr(content, isCompressed)
  }

  async getObjectMeta(path: string) {
    try {
      const result = await this.store.head(this.path.getPath(path))
      return result || undefined
    } catch (err) {
      if (err.code !== 'NoSuchKey') {
        throw err
      }
      return
    }
  }

  async getObjectAndMeta(
    path: string,
    metaKeys: string[],
    isCompressed = false
  ) {
    let content
    let meta

    try {
      const result = await this.store.getAsBuffer(
        this.path.getPath(path),
        metaKeys
      )
      content = result?.content
      meta = result?.meta
    } catch (err) {
      if (err.code !== 'NoSuchKey') {
        throw err
      }
    }

    return { content: toStr(content, isCompressed), meta }
  }

  async putObject(
    path: string,
    raw: string,
    options?: ObjectOptions,
    isCompressed?: boolean
  ) {
    await this.store.put(
      this.path.getPath(path),
      toBuffer(raw, isCompressed),
      options
    )
  }

  async deleteObject(path: string) {
    await this.store.del(this.path.getPath(path))
  }

  async copyObject(fromPath: string, toPath: string, options: ObjectOptions) {
    await this.store.copy(
      this.path.getPath(toPath),
      this.path.getPath(fromPath),
      options
    )
  }
}
